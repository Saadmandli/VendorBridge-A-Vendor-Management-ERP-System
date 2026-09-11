import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/rbac";
import { logActivity, notify } from "@/lib/activity";
import { genNumber } from "@/lib/utils";

export async function GET() {
  try {
    const user = await requireUser();
    const where = user.role === "SELLER" && user.vendorId ? { vendorId: user.vendorId } : {};
    const orders = await prisma.purchaseOrder.findMany({
      where, orderBy: { createdAt: "desc" },
      include: { vendor: true, quotation: { include: { rfq: true } }, invoice: true, goodsReceipts: true },
    });
    const formattedOrders = orders.map((o) => ({
      ...o,
      goodsReceipt: o.goodsReceipts[0] || null,
    }));
    return NextResponse.json({ orders: formattedOrders });
  } catch (e) { return err(e); }
}

// Generate a PO from an approved quotation, computing realized savings.
export async function POST(req: Request) {
  try {
    const user = await requireUser(["BUYER", "ADMIN"]);
    const { quotationId, taxRate } = await req.json();
    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: {
        vendor: true,
        rfq: { include: { approvals: true, quotations: true } },
        purchaseOrder: true,
        items: { include: { rfqItem: true } },
      },
    });
    if (!quotation) return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    if (quotation.purchaseOrder) return NextResponse.json({ error: "A purchase order already exists for this quotation" }, { status: 409 });

    const approved = quotation.rfq.approvals.some((a) => a.quotationId === quotationId && a.status === "APPROVED");
    if (!approved) return NextResponse.json({ error: "Quotation must be approved before generating a PO" }, { status: 400 });

    const subtotal = quotation.totalAmount;
    let totalTax = 0;
    if (quotation.items && quotation.items.length > 0) {
      for (const it of quotation.items) {
        const itemGst = it.rfqItem?.gstRate ?? 18;
        totalTax += it.amount * (itemGst / 100);
      }
    } else {
      const fallbackRate = taxRate !== undefined ? Number(taxRate) : 18;
      totalTax = subtotal * (fallbackRate / 100);
    }
    const taxAmount = +totalTax.toFixed(2);
    const totalAmount = +(subtotal + taxAmount).toFixed(2);
    const effectiveTaxRate = subtotal > 0 ? +((taxAmount / subtotal) * 100).toFixed(2) : 18;

    // Realized savings: highest competing bid minus the awarded subtotal.
    const competing = quotation.rfq.quotations.map((q) => q.totalAmount);
    const highest = competing.length ? Math.max(...competing) : subtotal;
    const savings = +Math.max(0, highest - subtotal).toFixed(2);
    const budgetSaving = quotation.rfq.budgetAmount ? +Math.max(0, quotation.rfq.budgetAmount - subtotal).toFixed(2) : 0;

    const count = await prisma.purchaseOrder.count();
    const poNumber = await genNumber("PO", count);

    const po = await prisma.purchaseOrder.create({
      data: { poNumber, quotationId, vendorId: quotation.vendorId, subtotal, taxRate: effectiveTaxRate, taxAmount, totalAmount, savings, budgetSaving, status: "ISSUED" },
      include: { vendor: true },
    });

    await logActivity({ userId: user.id, action: "CREATE", entityType: "PurchaseOrder", entityId: po.id, message: `PO ${po.poNumber} issued to ${po.vendor.name} (saved ₹${savings.toLocaleString("en-IN")})` });
    const vu = await prisma.user.findFirst({ where: { vendorId: quotation.vendorId, role: "SELLER" } });
    if (vu) await notify(vu.id, "PO", `Purchase order ${po.poNumber} issued to you`, `/purchase-orders`);
    return NextResponse.json({ po }, { status: 201 });
  } catch (e) { return err(e); }
}

function err(e: unknown) {
  if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
  console.error(e); return NextResponse.json({ error: "Server error" }, { status: 500 });
}
