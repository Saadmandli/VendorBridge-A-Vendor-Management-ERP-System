import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/rbac";
import { logActivity, notify } from "@/lib/activity";
import { resolveTier } from "@/lib/approval-policy";
import { genNumber } from "@/lib/utils";

// POST /api/quotations/[id]/award
// Atomic Final Award Engine: Commits sandboxed negotiation terms, awards RFQ, batch-rejects competing bids, and applies spend policy.
export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(["BUYER", "ADMIN"]);

    // 1. Fetch target quotation and pre-commit checks
    const quotation = await prisma.quotation.findUnique({
      where: { id: params.id },
      include: {
        vendor: true,
        items: { include: { rfqItem: true } },
        counterOffers: { orderBy: { createdAt: "desc" } },
        rfq: {
          include: {
            quotations: true,
            items: true,
          },
        },
      },
    });

    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    const { rfq } = quotation;

    // Pre-Commit Check: Ensure RFQ is still OPEN and not already awarded or locked
    if (rfq.status !== "OPEN") {
      return NextResponse.json(
        { error: `Cannot award quotation. RFQ is currently ${rfq.status} and locked for further awards.` },
        { status: 409 }
      );
    }

    // 2. Resolve Staged Final Snapshot (Price & Delivery Schedule)
    const acceptedCounter = quotation.counterOffers.find((c) => c.status === "ACCEPTED");
    const latestCounter = quotation.counterOffers[0];
    
    // Effective final price & days from staged accepted offer, latest offer, or baseline quote
    const finalPrice = acceptedCounter
      ? acceptedCounter.targetPrice
      : latestCounter && (latestCounter.status === "PENDING" || latestCounter.status === "PENDING_BUYER_RESPONSE")
      ? latestCounter.targetPrice
      : quotation.totalAmount;

    const finalDays = acceptedCounter
      ? acceptedCounter.targetDays
      : latestCounter && (latestCounter.status === "PENDING" || latestCounter.status === "PENDING_BUYER_RESPONSE")
      ? latestCounter.targetDays
      : quotation.deliveryDays;

    // 3. Resolve Delegation of Authority & Spend Policy Tier
    const tier = resolveTier(finalPrice);
    const isAutoApproved = tier.autoApprove;

    // 4. Calculate Realized Savings (vs highest competing bid and vs budget)
    const competingPrices = rfq.quotations.map((q) => q.totalAmount);
    const highestCompetingPrice = competingPrices.length > 0 ? Math.max(...competingPrices) : finalPrice;
    const savings = +Math.max(0, highestCompetingPrice - finalPrice).toFixed(2);
    const budgetSaving = rfq.budgetAmount ? +Math.max(0, rfq.budgetAmount - finalPrice).toFixed(2) : 0;

    // 5. Execute All-or-Nothing Atomic Transaction ($transaction)
    const result = await prisma.$transaction(async (tx) => {
      // Step A: Promote target quotation to SELECTED with final agreed terms
      const updatedQuotation = await tx.quotation.update({
        where: { id: params.id },
        data: {
          status: "SELECTED",
          totalAmount: finalPrice,
          deliveryDays: finalDays,
        },
      });

      // Step B: Atomically batch-reject all competing quotations on this RFQ
      const competingQuotationIds = rfq.quotations
        .filter((q) => q.id !== params.id)
        .map((q) => q.id);

      if (competingQuotationIds.length > 0) {
        await tx.quotation.updateMany({
          where: { id: { in: competingQuotationIds } },
          data: { status: "REJECTED" },
        });
      }

      // Step C: Transition RFQ status to AWARDED
      const updatedRfq = await tx.rFQ.update({
        where: { id: rfq.id },
        data: { status: "AWARDED" },
      });

      // Step D: Create Approval audit record based on Spend Policy
      const approval = await tx.approval.create({
        data: {
          rfqId: rfq.id,
          quotationId: params.id,
          status: isAutoApproved ? "APPROVED" : "PENDING",
          autoApproved: isAutoApproved,
          tier: tier.name,
          decidedAt: isAutoApproved ? new Date() : null,
          remarks: isAutoApproved
            ? `Auto-approved: Final negotiated amount ₹${finalPrice.toLocaleString("en-IN")} within threshold (${tier.name})`
            : `Delegation of authority approval required (${tier.name})`,
        },
      });

      let createdPo = null;

      // Step E: If auto-approved, immediately issue formal Purchase Order
      if (isAutoApproved) {
        const poCount = await tx.purchaseOrder.count();
        const poNumber = await genNumber("PO", poCount);

        let totalTax = 0;
        if (quotation.items && quotation.items.length > 0) {
          for (const it of quotation.items) {
            const itemGst = it.rfqItem?.gstRate ?? 18;
            totalTax += (it.amount * (finalPrice / (quotation.totalAmount || 1))) * (itemGst / 100);
          }
        } else {
          totalTax = finalPrice * 0.18;
        }
        const taxAmount = +totalTax.toFixed(2);
        const poTotalAmount = +(finalPrice + taxAmount).toFixed(2);
        const effectiveTaxRate = finalPrice > 0 ? +((taxAmount / finalPrice) * 100).toFixed(2) : 18;

        createdPo = await tx.purchaseOrder.create({
          data: {
            poNumber,
            quotationId: params.id,
            vendorId: quotation.vendorId,
            subtotal: finalPrice,
            taxRate: effectiveTaxRate,
            taxAmount,
            totalAmount: poTotalAmount,
            savings,
            budgetSaving,
            status: "ISSUED",
          },
        });
      }

      // Step F: Immutable Activity Log entry
      await tx.activityLog.create({
        data: {
          userId: user.id,
          action: "FINAL_AWARD",
          entityType: "RFQ",
          entityId: rfq.id,
          message: `${user.name} locked & awarded ${rfq.rfqNumber} to ${quotation.vendor.name} at ₹${finalPrice.toLocaleString("en-IN")} (${finalDays} days delivery). ${competingQuotationIds.length} competing bids marked REJECTED.`,
        },
      });

      return { updatedQuotation, updatedRfq, approval, createdPo };
    });

    // 6. Post-transaction notifications
    const sellerUser = await prisma.user.findFirst({
      where: { vendorId: quotation.vendorId, role: "SELLER" },
    });
    if (sellerUser) {
      await notify(
        sellerUser.id,
        "AWARD",
        `Congratulations! Your bid on ${rfq.rfqNumber} has been awarded at ₹${finalPrice.toLocaleString("en-IN")}.`,
        `/rfqs/${rfq.id}`
      );
    }

    if (!isAutoApproved) {
      const approvers = await prisma.user.findMany({ where: { role: "ADMIN" } });
      for (const m of approvers) {
        await notify(
          m.id,
          "APPROVAL",
          `Final award sign-off needed for ${rfq.rfqNumber} — ${quotation.vendor.name} (₹${finalPrice.toLocaleString("en-IN")})`,
          `/approvals`
        );
      }
    }

    return NextResponse.json({
      success: true,
      rfq: result.updatedRfq,
      quotation: result.updatedQuotation,
      approval: result.approval,
      purchaseOrder: result.createdPo,
      stagedTerms: {
        finalPrice,
        finalDays,
        savings,
        budgetSaving,
      },
    });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("Atomic Final Award Error:", e);
    return NextResponse.json({ error: "Server error executing final award transaction" }, { status: 500 });
  }
}
