import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/rbac";
import { logActivity } from "@/lib/activity";
import { genNumber } from "@/lib/utils";
import { reconcileMatch } from "@/lib/match";

export async function GET() {
  try {
    const user = await requireUser();
    const where = user.role === "SELLER" && user.vendorId
      ? { purchaseOrder: { vendorId: user.vendorId } } : {};
    const invoices = await prisma.invoice.findMany({
      where, orderBy: { createdAt: "desc" },
      include: { purchaseOrder: { include: { vendor: true, quotation: { include: { rfq: true } }, goodsReceipts: true } } },
    });
    const formattedInvoices = invoices.map((inv) => ({
      ...inv,
      purchaseOrder: inv.purchaseOrder
        ? {
            ...inv.purchaseOrder,
            goodsReceipt: (inv.purchaseOrder as any).goodsReceipts?.[0] || null,
          }
        : null,
    }));
    return NextResponse.json({ invoices: formattedInvoices });
  } catch (e) { return err(e); }
}

// Generate invoice from a PO, then run the 3-way match.
export async function POST(req: Request) {
  try {
    const user = await requireUser(["BUYER", "ADMIN"]);
    const { purchaseOrderId } = await req.json();
    const po = await prisma.purchaseOrder.findUnique({ where: { id: purchaseOrderId }, include: { invoice: true, vendor: true } });
    if (!po) return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
    if (po.invoice) return NextResponse.json({ error: "Invoice already generated for this PO", invoice: po.invoice }, { status: 409 });

    const count = await prisma.invoice.count();
    const invoiceNumber = await genNumber("INV", count);
    const invoice = await prisma.invoice.create({
      data: { invoiceNumber, purchaseOrderId, subtotal: po.subtotal, taxRate: po.taxRate, taxAmount: po.taxAmount, totalAmount: po.totalAmount, status: "DRAFT" },
    });
    const match = await reconcileMatch(purchaseOrderId);
    await logActivity({ userId: user.id, action: "CREATE", entityType: "Invoice", entityId: invoice.id, message: `Invoice ${invoice.invoiceNumber} generated for ${po.poNumber} (match: ${match})` });
    return NextResponse.json({ invoice, match }, { status: 201 });
  } catch (e) { return err(e); }
}

function err(e: unknown) {
  if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
  console.error(e); return NextResponse.json({ error: "Server error" }, { status: 500 });
}
