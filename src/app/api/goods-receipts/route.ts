import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/rbac";
import { logActivity } from "@/lib/activity";
import { genNumber } from "@/lib/utils";
import { reconcileMatch } from "@/lib/match";

export async function GET() {
  try {
    await requireUser();
    const receipts = await prisma.goodsReceipt.findMany({
      orderBy: { createdAt: "desc" },
      include: { purchaseOrder: { include: { vendor: true } }, items: { include: { rfqItem: true } }, receivedBy: { select: { name: true } } },
    });
    return NextResponse.json({ receipts });
  } catch (e) { return err(e); }
}

// Record receipt of goods against a PO. Lines: [{ rfqItemId, receivedQty }]
export async function POST(req: Request) {
  try {
    const user = await requireUser(["BUYER", "ADMIN"]);
    const { purchaseOrderId, notes, lines } = await req.json();
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: {
        goodsReceipts: { include: { items: true } },
        quotation: { include: { items: { include: { rfqItem: true } } } },
      },
    });
    if (!po) return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });

    // Compute prior received quantities per line item
    const priorReceived: Record<string, number> = {};
    for (const priorGrn of po.goodsReceipts) {
      for (const item of priorGrn.items) {
        priorReceived[item.rfqItemId] = (priorReceived[item.rfqItemId] || 0) + item.receivedQty;
      }
    }

    // Check if order is already 100% fulfilled
    const isAlreadyFullyFulfilled = po.quotation.items.every(
      (it) => (priorReceived[it.rfqItemId] || 0) >= it.quantity
    );
    if (isAlreadyFullyFulfilled) {
      return NextResponse.json({ error: "All items for this Purchase Order have already been fully received" }, { status: 400 });
    }

    const grnItems = po.quotation.items.map((it) => {
      const prior = priorReceived[it.rfqItemId] || 0;
      const remaining = Math.max(0, it.quantity - prior);
      const line = (lines || []).find((l: any) => l.rfqItemId === it.rfqItemId);
      const newlyReceived = line ? Math.max(0, Math.min(Number(line.receivedQty), remaining)) : remaining;
      return {
        rfqItemId: it.rfqItemId,
        orderedQty: it.quantity,
        receivedQty: newlyReceived,
      };
    });

    const isNewlyComplete = po.quotation.items.every((it) => {
      const prior = priorReceived[it.rfqItemId] || 0;
      const current = grnItems.find((g) => g.rfqItemId === it.rfqItemId)?.receivedQty || 0;
      return (prior + current) >= it.quantity;
    });

    const count = await prisma.goodsReceipt.count();
    const grnNumber = await genNumber("GRN", count);
    const grn = await prisma.goodsReceipt.create({
      data: {
        grnNumber,
        purchaseOrderId,
        receivedById: user.id,
        notes: notes || null,
        status: isNewlyComplete ? "COMPLETE" : "PARTIAL",
        items: { create: grnItems },
      },
      include: { items: true },
    });
    await prisma.purchaseOrder.update({
      where: { id: purchaseOrderId },
      data: { status: isNewlyComplete ? "RECEIVED" : "ACKNOWLEDGED" },
    });
    const match = await reconcileMatch(purchaseOrderId);

    await logActivity({ userId: user.id, action: "RECEIVE", entityType: "GoodsReceipt", entityId: grn.id, message: `Goods received (${grn.grnNumber}) for PO ${po.poNumber} — ${isNewlyComplete ? "complete" : "partial"}; match ${match}` });
    return NextResponse.json({ grn, match }, { status: 201 });
  } catch (e) { return err(e); }
}

function err(e: unknown) {
  if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
  console.error(e); return NextResponse.json({ error: "Server error" }, { status: 500 });
}
