import { prisma } from "./prisma";

/** Computes a vendor performance scorecard from historical procurement data. */
export type ScorecardInput = {
  rating: number;
  quotesSubmitted: number;
  ordersWon: number;
  ordersReceived: number;   // POs with goods receipt
  totalSpend: number;
};

export type Scorecard = ScorecardInput & {
  winRate: number;          // % of quotes that became orders
  fulfillmentRate: number;  // % of orders received
  performance: number;      // 0–100 composite
  grade: "A" | "B" | "C" | "D";
};

export type VendorPerformanceMetrics = {
  totalOrders: number;
  onTimeDeliveries: number;
  totalOrderedItems: number;
  accurateReceivedItems: number;
};

/**
 * Computes an objective 0–5.0 star vendor rating from empirical fulfillment data:
 * - On-Time Delivery Rate (60% weight)
 * - Zero-Defect / Fulfillment Accuracy Rate (40% weight)
 * Returns baseline 4.0 if vendor has no completed historical orders yet.
 */
export function calculateObjectiveRating(metrics: VendorPerformanceMetrics): number {
  if (!metrics.totalOrders || metrics.totalOrders === 0) {
    return 4.0; // Baseline rating for new suppliers
  }

  const onTimeRate = (metrics.onTimeDeliveries / metrics.totalOrders) * 100;
  const accuracyRate = metrics.totalOrderedItems > 0
    ? (metrics.accurateReceivedItems / metrics.totalOrderedItems) * 100
    : 100;

  const normalizedScore = (onTimeRate * 0.60) + (accuracyRate * 0.40); // 0–100 scale
  const starRating = (normalizedScore / 100) * 5.0; // Convert to 0–5.0 stars
  return +Math.max(1.0, Math.min(5.0, starRating)).toFixed(1);
}

/**
 * Calculates dynamic objective vendor rating querying historical POs and GRNs from DB.
 */
export async function getVendorDynamicRating(vendorId: string): Promise<number> {
  const pos = await prisma.purchaseOrder.findMany({
    where: { vendorId },
    include: {
      goodsReceipts: { include: { items: true } },
      quotation: true,
    },
  });

  if (pos.length === 0) return 4.0;

  let totalOrders = 0;
  let onTimeDeliveries = 0;
  let totalOrderedItems = 0;
  let accurateReceivedItems = 0;

  for (const po of pos) {
    if (!po.goodsReceipts || po.goodsReceipts.length === 0) continue;
    totalOrders++;

    const promisedDays = po.quotation?.deliveryDays ?? 7;
    const promisedDeliveryDate = new Date(po.createdAt.getTime() + promisedDays * 24 * 60 * 60 * 1000);
    const lastGrnDate = po.goodsReceipts.reduce(
      (latest, g) => (g.createdAt > latest ? g.createdAt : latest),
      po.goodsReceipts[0].createdAt
    );

    if (lastGrnDate <= promisedDeliveryDate) {
      onTimeDeliveries++;
    }

    for (const grn of po.goodsReceipts) {
      for (const it of grn.items) {
        totalOrderedItems += it.orderedQty;
        accurateReceivedItems += Math.min(it.receivedQty, it.orderedQty);
      }
    }
  }

  if (totalOrders === 0) return 4.0;

  return calculateObjectiveRating({
    totalOrders,
    onTimeDeliveries,
    totalOrderedItems,
    accurateReceivedItems,
  });
}

export function computeScorecard(i: ScorecardInput): Scorecard {
  const winRate = i.quotesSubmitted ? (i.ordersWon / i.quotesSubmitted) * 100 : 0;
  const fulfillmentRate = i.ordersWon ? (i.ordersReceived / i.ordersWon) * 100 : 0;
  const performance = +(
    (i.rating / 5) * 40 +
    (winRate / 100) * 25 +
    (fulfillmentRate / 100) * 25 +
    Math.min(i.totalSpend / 5000000, 1) * 10
  ).toFixed(1) * 1;
  const score = +performance.toFixed(1);
  const grade = score >= 75 ? "A" : score >= 55 ? "B" : score >= 35 ? "C" : "D";
  return { ...i, winRate: +winRate.toFixed(0), fulfillmentRate: +fulfillmentRate.toFixed(0), performance: score, grade };
}
