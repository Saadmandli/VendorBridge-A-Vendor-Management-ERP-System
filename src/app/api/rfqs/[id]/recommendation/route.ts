import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/rbac";
import { scoreQuotations } from "@/lib/scoring";
import { getVendorDynamicRating } from "@/lib/scorecard";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    await requireUser(["BUYER", "ADMIN"]);
    const rfq = await prisma.rFQ.findUnique({
      where: { id: params.id },
      select: { deadline: true, status: true },
    });
    if (!rfq) return NextResponse.json({ error: "RFQ not found" }, { status: 404 });

    const quotes = await prisma.quotation.findMany({
      where: { rfqId: params.id, status: { in: ["SUBMITTED", "SELECTED"] } },
      include: { vendor: true },
    });

    const scoredInputs = await Promise.all(
      quotes.map(async (q) => {
        const objectiveRating = await getVendorDynamicRating(q.vendorId);
        return {
          quotationId: q.id,
          vendorName: q.vendor.name,
          vendorRating: objectiveRating,
          vendorStatus: q.vendor.status,
          totalAmount: q.totalAmount,
          deliveryDays: q.deliveryDays,
        };
      })
    );

    const rec = scoreQuotations(scoredInputs);
    return NextResponse.json({ ...rec, sealed: false });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e); return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
