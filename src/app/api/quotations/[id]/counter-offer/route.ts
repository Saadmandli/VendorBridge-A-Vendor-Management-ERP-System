import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/rbac";
import { logActivity, notify } from "@/lib/activity";

// GET /api/quotations/[id]/counter-offer - Retrieve sandboxed negotiation history for a quotation
export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    await requireUser();
    const quotation = await prisma.quotation.findUnique({
      where: { id: params.id },
      select: { id: true, totalAmount: true, deliveryDays: true },
    });
    if (!quotation) return NextResponse.json({ error: "Quotation not found" }, { status: 404 });

    const counterOffers = await prisma.counterOffer.findMany({
      where: { quotationId: params.id },
      orderBy: { createdAt: "desc" },
      include: { createdBy: { select: { name: true, role: true } } },
    });

    return NextResponse.json({
      quotation,
      counterOffers,
    });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/quotations/[id]/counter-offer - Create a sandboxed counter-offer proposal
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const { targetPrice, targetDays, message } = await req.json();

    if (!targetPrice || !targetDays) {
      return NextResponse.json({ error: "Target price and target delivery days are required" }, { status: 400 });
    }

    const quotation = await prisma.quotation.findUnique({
      where: { id: params.id },
      include: { rfq: true, vendor: true },
    });
    if (!quotation) return NextResponse.json({ error: "Quotation not found" }, { status: 404 });

    if (new Date() > new Date(quotation.rfq.deadline)) {
      return NextResponse.json({ error: "RFQ deadline has passed. Negotiations closed." }, { status: 400 });
    }
    if (quotation.rfq.status !== "OPEN") {
      return NextResponse.json({ error: "This RFQ is no longer open for negotiations." }, { status: 400 });
    }

    const initialStatus = user.role === "SELLER" ? "PENDING_BUYER_RESPONSE" : "PENDING_SELLER_RESPONSE";

    const counter = await prisma.counterOffer.create({
      data: {
        quotationId: params.id,
        targetPrice: Number(targetPrice),
        targetDays: Number(targetDays),
        message: message || null,
        createdById: user.id,
        status: initialStatus,
      },
    });

    await logActivity({
      userId: user.id,
      action: "STAGED_COUNTER_OFFER",
      entityType: "Quotation",
      entityId: params.id,
      message: `${user.name} proposed staged counter-offer for ${quotation.vendor.name} (Target: ₹${Number(targetPrice).toLocaleString("en-IN")}, ${targetDays} days)`,
    });

    if (user.role === "SELLER") {
      await notify(
        quotation.rfq.createdById,
        "COUNTER_OFFER",
        `Vendor ${quotation.vendor.name} submitted counter-offer on ${quotation.rfq.rfqNumber}`,
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
          `Buyer submitted counter-offer on ${quotation.rfq.rfqNumber}`,
          `/rfqs/${quotation.rfqId}`
        );
      }
    }

    return NextResponse.json({ counter }, { status: 201 });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
