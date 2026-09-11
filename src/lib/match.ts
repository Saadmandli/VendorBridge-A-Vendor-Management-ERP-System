import { prisma } from "./prisma";

/**
 * Enterprise Pro-Rata 3-Way Matching Engine
 * ----------------------------------------
 * Verifies PO vs. Cumulative Goods Receipts (GRNs) vs. Supplier Invoice.
 * - PENDING: No goods received yet.
 * - MATCHED: 100% of ordered quantities verified across GRNs and invoice matches PO total.
 * - PARTIALLY_MATCHED: Partial goods verified across GRNs and invoice does not exceed delivered value.
 * - MISMATCH: Invoiced amounts exceed verified delivered goods or rate discrepancies detected.
 */
export async function reconcileMatch(purchaseOrderId: string) {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: purchaseOrderId },
    include: {
      invoice: true,
      goodsReceipts: { include: { items: true } },
      quotation: { include: { items: { include: { rfqItem: true } } } },
    },
  });

  if (!po || !po.invoice) return "PENDING";
  if (!po.goodsReceipts || po.goodsReceipts.length === 0) {
    await prisma.invoice.update({ where: { id: po.invoice.id }, data: { matchStatus: "PENDING" } });
    return "PENDING";
  }

  // 1. Tally cumulative received quantities per line item across all GRNs
  const cumulativeReceived: Record<string, number> = {};
  for (const grn of po.goodsReceipts) {
    for (const item of grn.items) {
      cumulativeReceived[item.rfqItemId] = (cumulativeReceived[item.rfqItemId] || 0) + item.receivedQty;
    }
  }

  // 2. Compute ordered totals, received totals, and verified delivered monetary value
  let totalOrderedQty = 0;
  let totalReceivedQty = 0;
  let verifiedDeliveredValue = 0;

  const quoteItems = po.quotation?.items || [];
  for (const qItem of quoteItems) {
    totalOrderedQty += qItem.quantity;
    const received = cumulativeReceived[qItem.rfqItemId] || 0;
    totalReceivedQty += received;

    const matchedQty = Math.min(received, qItem.quantity);
    const subtotal = matchedQty * qItem.unitPrice;
    const gstRate = qItem.rfqItem?.gstRate ?? po.taxRate ?? 18;
    const tax = subtotal * (gstRate / 100);
    verifiedDeliveredValue += (subtotal + tax);
  }

  if (totalReceivedQty === 0) {
    await prisma.invoice.update({ where: { id: po.invoice.id }, data: { matchStatus: "PENDING" } });
    return "PENDING";
  }

  const invoiceAmount = po.invoice.totalAmount;
  const poAmount = po.totalAmount;
  let status: "MATCHED" | "PARTIALLY_MATCHED" | "MISMATCH" | "PENDING";

  const isFullyReceived = quoteItems.every(
    (qItem) => (cumulativeReceived[qItem.rfqItemId] || 0) >= qItem.quantity
  );

  if (isFullyReceived) {
    // 100% received: Invoice must match PO total
    if (Math.abs(invoiceAmount - poAmount) <= 1.0) {
      status = "MATCHED";
    } else {
      status = "MISMATCH";
    }
  } else {
    // Partial fulfillment: invoice must not exceed the verified delivered value
    if (invoiceAmount <= verifiedDeliveredValue + 1.0) {
      status = "PARTIALLY_MATCHED";
    } else {
      status = "MISMATCH";
    }
  }

  await prisma.invoice.update({
    where: { id: po.invoice.id },
    data: { matchStatus: status as any },
  });

  return status;
}
