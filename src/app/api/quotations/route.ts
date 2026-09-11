import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/rbac";
import { logActivity, notify } from "@/lib/activity";

export async function POST(req: Request) {
  try {
    const user = await requireUser(["SELLER", "ADMIN"]);
    const body = await req.json();
    const { rfqId, deliveryDays, notes, items } = body; // items: [{rfqItemId, unitPrice}]
    if (!rfqId || !Array.isArray(items) || items.length === 0)
      return NextResponse.json({ error: "RFQ and item pricing are required" }, { status: 400 });

    const vendorId = user.role === "SELLER" ? user.vendorId : body.vendorId;
    if (!vendorId) return NextResponse.json({ error: "Vendor not resolved" }, { status: 400 });

    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    if (vendor.isBlacklisted || vendor.status === "BLACKLISTED") {
      return NextResponse.json(
        { error: "Access denied. Blacklisted suppliers are prohibited from submitting quotations." },
        { status: 403 }
      );
    }

    const rfq = await prisma.rFQ.findUnique({ where: { id: rfqId }, include: { items: true, createdBy: true, invitedVendors: true } });
    if (!rfq) return NextResponse.json({ error: "RFQ not found" }, { status: 404 });
    if (rfq.status !== "OPEN") return NextResponse.json({ error: "This RFQ is no longer accepting quotations" }, { status: 400 });
    if (new Date() > new Date(rfq.deadline))
      return NextResponse.json({ error: "Bidding deadline for this RFQ has expired. No new quotations are accepted." }, { status: 400 });

    // Access control: a vendor may only quote on RFQs they were invited to.
    if (user.role === "SELLER" && !rfq.invitedVendors.some((iv) => iv.vendorId === vendorId))
      return NextResponse.json({ error: "You have not been invited to quote on this RFQ" }, { status: 403 });

    // Integrity: only accept pricing for items that belong to this RFQ.
    const validItemIds = new Set(rfq.items.map((i) => i.id));
    if (!items.every((it: any) => validItemIds.has(it.rfqItemId)))
      return NextResponse.json({ error: "Quotation contains items that do not belong to this RFQ" }, { status: 400 });

    const lineData = items.map((it: any) => {
      const rfqItem = rfq.items.find((r) => r.id === it.rfqItemId);
      const qty = rfqItem?.quantity || 0;
      const unitPrice = Number(it.unitPrice) || 0;
      return { rfqItemId: it.rfqItemId, unitPrice, quantity: qty, amount: unitPrice * qty };
    });
    const totalAmount = lineData.reduce((s: number, l: any) => s + l.amount, 0);

    // Upsert: a vendor has one quotation per RFQ
    const existing = await prisma.quotation.findUnique({ where: { rfqId_vendorId: { rfqId, vendorId } } });
    let quotation;
    if (existing) {
      await prisma.quotationItem.deleteMany({ where: { quotationId: existing.id } });
      quotation = await prisma.quotation.update({
        where: { id: existing.id },
        data: { deliveryDays: Number(deliveryDays) || 0, notes: notes || null, status: "SUBMITTED", totalAmount, items: { create: lineData } },
        include: { vendor: true },
      });
    } else {
      quotation = await prisma.quotation.create({
        data: { rfqId, vendorId, deliveryDays: Number(deliveryDays) || 0, notes: notes || null, status: "SUBMITTED", totalAmount, items: { create: lineData } },
        include: { vendor: true },
      });
    }

    await logActivity({ userId: user.id, action: "SUBMIT", entityType: "Quotation", entityId: quotation.id, message: `${quotation.vendor.name} submitted a quotation for ${rfq.rfqNumber}` });
    await notify(rfq.createdById, "QUOTATION", `${quotation.vendor.name} submitted a quotation for ${rfq.rfqNumber}`, `/rfqs/${rfq.id}`);
    return NextResponse.json({ quotation }, { status: 201 });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e); return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
