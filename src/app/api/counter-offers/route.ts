import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/rbac";
import { logActivity, notify } from "@/lib/activity";

// Create or respond to counter-offers between Buyers and Sellers
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const { action } = body;

    // Buyer or Seller creates a new counter-offer round
    if (action === "CREATE") {
      const { quotationId, targetPrice, targetDays, message } = body;
      if (!quotationId || !targetPrice || !targetDays) {
        return NextResponse.json({ error: "Quotation ID, target price, and delivery timeline are required" }, { status: 400 });
      }

      const quotation = await prisma.quotation.findUnique({
        where: { id: quotationId },
        include: { rfq: true, vendor: true },
      });
      if (!quotation) return NextResponse.json({ error: "Quotation not found" }, { status: 404 });

      if (new Date() > new Date(quotation.rfq.deadline)) {
        return NextResponse.json({ error: "Bidding deadline for this RFQ has expired. No negotiations permitted." }, { status: 400 });
      }
      if (quotation.rfq.status !== "OPEN") {
        return NextResponse.json({ error: "This RFQ is no longer open for negotiations." }, { status: 400 });
      }

      const initialStatus = user.role === "SELLER" ? "PENDING_BUYER_RESPONSE" : "PENDING_SELLER_RESPONSE";

      const counter = await prisma.counterOffer.create({
        data: {
          quotationId,
          targetPrice: Number(targetPrice),
          targetDays: Number(targetDays),
          message: message || null,
          createdById: user.id,
          status: initialStatus,
        },
      });

      await logActivity({
        userId: user.id,
        action: "COUNTER_OFFER",
        entityType: "Quotation",
        entityId: quotationId,
        message: `${user.name} proposed counter-terms for ${quotation.vendor.name} (₹${Number(targetPrice).toLocaleString("en-IN")}, ${targetDays} days)`,
      });

      // Dispatch notifications to opposite party
      if (user.role === "SELLER") {
        await notify(
          quotation.rfq.createdById,
          "COUNTER_OFFER",
          `Supplier ${quotation.vendor.name} countered on ${quotation.rfq.rfqNumber}: Target ₹${Number(targetPrice).toLocaleString("en-IN")}, ${targetDays} days`,
          `/rfqs/${quotation.rfqId}`
        );
      } else {
        const sellerUser = await prisma.user.findFirst({
          where: { vendorId: quotation.vendorId, role: "SELLER" },
        });
        if (sellerUser) {
          await notify(
            sellerUser.id,
            "COUNTER_OFFER",
            `Buyer submitted counter-offer on ${quotation.rfq.rfqNumber}: Target ₹${Number(targetPrice).toLocaleString("en-IN")}, ${targetDays} days`,
            `/rfqs/${quotation.rfqId}`
          );
        }
      }

      return NextResponse.json({ counter }, { status: 201 });
    }

    // Propose revised terms in an ongoing round (COUNTER_BACK)
    if (action === "COUNTER_BACK") {
      const { counterId, targetPrice, targetDays, message } = body;
      if (!counterId || !targetPrice || !targetDays) {
        return NextResponse.json({ error: "Counter ID, revised price, and delivery timeline are required" }, { status: 400 });
      }

      const counter = await prisma.counterOffer.findUnique({
        where: { id: counterId },
        include: { quotation: { include: { rfq: true, vendor: true } } },
      });
      if (!counter) return NextResponse.json({ error: "Counter-offer not found" }, { status: 404 });

      if (new Date() > new Date(counter.quotation.rfq.deadline)) {
        return NextResponse.json({ error: "Bidding deadline for this RFQ has expired." }, { status: 400 });
      }

      const nextStatus = user.role === "SELLER" ? "PENDING_BUYER_RESPONSE" : "PENDING_SELLER_RESPONSE";

      const updatedCounter = await prisma.counterOffer.update({
        where: { id: counterId },
        data: {
          targetPrice: Number(targetPrice),
          targetDays: Number(targetDays),
          message: message || null,
          status: nextStatus,
        },
      });

      await logActivity({
        userId: user.id,
        action: "COUNTER_BACK",
        entityType: "Quotation",
        entityId: counter.quotationId,
        message: `${user.name} submitted revised negotiation terms for ${counter.quotation.rfq.rfqNumber}`,
      });

      return NextResponse.json({ counter: updatedCounter });
    }

    // Party accepts or rejects the current proposal
    if (action === "RESPOND") {
      const { counterId, response } = body; // ACCEPTED or REJECTED
      if (!counterId || !["ACCEPTED", "REJECTED"].includes(response)) {
        return NextResponse.json({ error: "Counter ID and valid response (ACCEPTED/REJECTED) are required" }, { status: 400 });
      }

      const counter = await prisma.counterOffer.findUnique({
        where: { id: counterId },
        include: { quotation: { include: { rfq: true, vendor: true } } },
      });
      if (!counter) return NextResponse.json({ error: "Counter-offer not found" }, { status: 404 });

      if (new Date() > new Date(counter.quotation.rfq.deadline)) {
        return NextResponse.json({ error: "Bidding deadline for this RFQ has expired." }, { status: 400 });
      }

      const updatedCounter = await prisma.counterOffer.update({
        where: { id: counterId },
        data: { status: response },
      });

      // Counter-offer response is recorded in staging layer (status = ACCEPTED or REJECTED)
      // Parent quotation baseline totalAmount and deliveryDays remain untouched until atomic final award execution.

      await logActivity({
        userId: user.id,
        action: `COUNTER_${response}`,
        entityType: "Quotation",
        entityId: counter.quotationId,
        message: `${user.name} marked counter-offer ${response.toLowerCase()} for ${counter.quotation.rfq.rfqNumber}`,
      });

      return NextResponse.json({ counter: updatedCounter });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await requireUser();
    const { searchParams } = new URL(req.url);
    const quotationId = searchParams.get("quotationId");
    if (!quotationId) return NextResponse.json({ error: "quotationId required" }, { status: 400 });

    const counterOffers = await prisma.counterOffer.findMany({
      where: { quotationId },
      orderBy: { createdAt: "desc" },
      include: { createdBy: { select: { name: true, role: true } } },
    });
    return NextResponse.json({ counterOffers });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
