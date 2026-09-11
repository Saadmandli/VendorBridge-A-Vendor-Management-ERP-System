import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/rbac";
import { logActivity, notify } from "@/lib/activity";
import { genNumber } from "@/lib/utils";
import { getCategoryGstRate } from "@/lib/categories";

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const qCategory = searchParams.get("category") || "";
    const qSubcategory = searchParams.get("subcategory") || "";

    let whereConditions: any = {};

    const isSeller = user.role === "SELLER";

    if (isSeller && user.vendorId) {
      const vendor = await prisma.vendor.findUnique({ where: { id: user.vendorId } });
      if (vendor && vendor.category) {
        whereConditions.OR = [
          { invitedVendors: { some: { vendorId: user.vendorId } } },
          {
            AND: [
              { status: "OPEN" },
              { category: { equals: vendor.category, mode: "insensitive" } },
              vendor.subcategory
                ? {
                    OR: [
                      { subcategory: { equals: vendor.subcategory, mode: "insensitive" } },
                      { subcategory: null },
                    ],
                  }
                : {},
            ],
          },
        ];
      } else {
        whereConditions = { invitedVendors: { some: { vendorId: user.vendorId } } };
      }
    } else if (user.role === "BUYER") {
      const andList: any[] = [{ createdById: user.id }];
      if (qCategory) andList.push({ category: { equals: qCategory, mode: "insensitive" } });
      if (qSubcategory) andList.push({ subcategory: { equals: qSubcategory, mode: "insensitive" } });
      whereConditions.AND = andList;
    } else {
      // ADMIN sees all RFQs for system monitoring
      const andList: any[] = [];
      if (qCategory) andList.push({ category: { equals: qCategory, mode: "insensitive" } });
      if (qSubcategory) andList.push({ subcategory: { equals: qSubcategory, mode: "insensitive" } });
      if (andList.length > 0) whereConditions.AND = andList;
    }

    const rfqs = await prisma.rFQ.findMany({
      where: whereConditions,
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { name: true } },
        items: true,
        invitedVendors: { include: { vendor: { select: { name: true } } } },
        _count: { select: { quotations: true } },
      },
    });
    return NextResponse.json({ rfqs });
  } catch (e) { return err(e); }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser(["BUYER"]);
    const body = await req.json();
    if (!body.title || !body.deadline || !Array.isArray(body.items) || body.items.length === 0)
      return NextResponse.json({ error: "Title, deadline and at least one item are required" }, { status: 400 });

    const count = await prisma.rFQ.count();
    const rfqNumber = await genNumber("RFQ", count);

    const defaultGst = getCategoryGstRate(body.category);

    // Exclude any blacklisted vendors from invitations
    const candidateIds = (body.vendorIds || []).map((id: string) => String(id));
    const eligibleVendors = candidateIds.length > 0
      ? await prisma.vendor.findMany({
          where: { id: { in: candidateIds }, isBlacklisted: false, status: { not: "BLACKLISTED" } },
          select: { id: true },
        })
      : [];

    const rfq = await prisma.rFQ.create({
      data: {
        rfqNumber,
        title: body.title,
        description: body.description || null,
        department: body.department || null,
        category: body.category || null,
        subcategory: body.subcategory || null,
        budgetAmount: body.budgetAmount ? Number(body.budgetAmount) : null,
        deadline: new Date(body.deadline),
        status: "OPEN",
        attachment: body.attachment || null,
        createdById: user.id,
        items: {
          create: body.items.map((it: any) => ({
            productName: it.productName,
            description: it.description || null,
            quantity: Number(it.quantity) || 1,
            unit: it.unit || "pcs",
            gstRate: it.gstRate !== undefined && it.gstRate !== null && it.gstRate !== "" ? Number(it.gstRate) : defaultGst,
          })),
        },
        invitedVendors: { create: eligibleVendors.map((v) => ({ vendorId: v.id })) },
      },
      include: { invitedVendors: true },
    });

    await logActivity({ userId: user.id, action: "CREATE", entityType: "RFQ", entityId: rfq.id, message: `RFQ ${rfq.rfqNumber} "${rfq.title}" created (${rfq.category} / ${rfq.subcategory})` });
    for (const iv of rfq.invitedVendors) {
      const vu = await prisma.user.findFirst({
        where: { vendorId: iv.vendorId, role: "SELLER" },
      });
      if (vu) await notify(vu.id, "RFQ", `You've been invited to quote on ${rfq.rfqNumber}: ${rfq.title}`, `/rfqs/${rfq.id}`);
    }
    return NextResponse.json({ rfq }, { status: 201 });
  } catch (e) { return err(e); }
}

function err(e: unknown) {
  if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
  console.error(e); return NextResponse.json({ error: "Server error" }, { status: 500 });
}
