import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/rbac";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const rfq = await prisma.rFQ.findUnique({
      where: { id: params.id },
      include: {
        createdBy: { select: { name: true, email: true } },
        items: true,
        invitedVendors: { include: { vendor: true } },
        quotations: { include: { vendor: true, items: { include: { rfqItem: true } } }, orderBy: { totalAmount: "asc" } },
        approvals: { include: { approver: { select: { name: true } }, quotation: { include: { vendor: true } } }, orderBy: { createdAt: "desc" } },
      },
    });
    if (!rfq) return NextResponse.json({ error: "RFQ not found" }, { status: 404 });

    // Buyers may only access RFQs created by them
    if (user.role === "BUYER" && rfq.createdById !== user.id) {
      return NextResponse.json({ error: "Access denied. You can only view your own RFQs." }, { status: 403 });
    }

    // Vendors may only access RFQs they were invited to or matching their category
    if (user.role === "SELLER") {
      if (!rfq.invitedVendors.some((iv) => iv.vendorId === user.vendorId)) {
        // Also check if status is OPEN and matches vendor category
        const vendor = user.vendorId ? await prisma.vendor.findUnique({ where: { id: user.vendorId } }) : null;
        const matchesCategory = vendor?.category && rfq.category && rfq.category.toLowerCase() === vendor.category.toLowerCase();
        if (rfq.status !== "OPEN" || !matchesCategory) {
          return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
      }
      // ...and only see their own quotation, not competitors'.
      rfq.quotations = rfq.quotations.filter((q) => q.vendorId === user.vendorId);
    }

    const isSealed = rfq.status === "OPEN" && new Date() < new Date(rfq.deadline);
    if (isSealed && user.role === "BUYER") {
      rfq.quotations = rfq.quotations.map((q) => ({
        id: q.id,
        rfqId: q.rfqId,
        vendorId: q.vendorId,
        vendor: { id: q.vendor.id, name: q.vendor.name, rating: q.vendor.rating, city: q.vendor.city },
        deliveryDays: 0,
        notes: null,
        status: q.status,
        totalAmount: 0,
        createdAt: q.createdAt,
        isSealed: true,
        items: [],
        approvals: [],
        counterOffers: [],
      })) as any;
    }

    return NextResponse.json({ rfq, isSealed });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e); return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
