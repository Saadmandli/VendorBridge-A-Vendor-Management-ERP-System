import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/rbac";
import { toCSV } from "@/lib/csv";
import { fmtDate } from "@/lib/utils";

export async function GET() {
  try {
    await requireUser(["ADMIN", "BUYER"]);
    const pos = await prisma.purchaseOrder.findMany({
      include: { vendor: true, quotation: { include: { rfq: true } }, invoice: true, goodsReceipts: true },
      orderBy: { createdAt: "desc" },
    });
    const rows = pos.map((p) => ({
      PO_Number: p.poNumber,
      RFQ_Number: p.quotation.rfq.rfqNumber,
      RFQ_Title: p.quotation.rfq.title,
      Vendor: p.vendor.name,
      Subtotal: p.subtotal,
      Tax: p.taxAmount,
      Total: p.totalAmount,
      Savings: p.savings,
      Budget_Saving: p.budgetSaving,
      PO_Status: p.status,
      Goods_Received: p.goodsReceipts && p.goodsReceipts.length > 0 ? (p.goodsReceipts.some(g => g.status === "COMPLETE") ? "COMPLETE" : "PARTIAL") : "NOT_RECEIVED",
      Invoice: p.invoice ? p.invoice.invoiceNumber : "",
      Invoice_Match: p.invoice ? p.invoice.matchStatus : "",
      Date: fmtDate(p.createdAt),
    }));
    const csv = toCSV(rows.length ? rows : [{ PO_Number: "", RFQ_Number: "", Vendor: "", Total: "" }]);
    return new NextResponse(csv, {
      headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="procurement-report-${Date.now()}.csv"` },
    });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e); return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
