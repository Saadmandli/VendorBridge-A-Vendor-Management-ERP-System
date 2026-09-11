import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/rbac";
import { computeScorecard, getVendorDynamicRating } from "@/lib/scorecard";

export async function GET() {
  try {
    await requireUser(["ADMIN", "BUYER"]);
    const vendors = await prisma.vendor.findMany({
      include: {
        _count: { select: { quotations: true } },
        purchaseOrders: { include: { goodsReceipts: true } },
      },
    });
    const cards = await Promise.all(
      vendors.map(async (v) => {
        const ordersWon = v.purchaseOrders.length;
        const ordersReceived = v.purchaseOrders.filter((p) => p.goodsReceipts && p.goodsReceipts.length > 0).length;
        const totalSpend = v.purchaseOrders.reduce((s, p) => s + p.totalAmount, 0);
        const dynamicRating = await getVendorDynamicRating(v.id);
        const sc = computeScorecard({ rating: dynamicRating, quotesSubmitted: v._count.quotations, ordersWon, ordersReceived, totalSpend });
        return { id: v.id, name: v.name, category: v.category, status: v.status, isBlacklisted: v.isBlacklisted, ...sc };
      })
    );
    cards.sort((a, b) => b.performance - a.performance);
    return NextResponse.json({ cards });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e); return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
