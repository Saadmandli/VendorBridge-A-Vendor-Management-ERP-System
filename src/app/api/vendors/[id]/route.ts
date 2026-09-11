import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/rbac";
import { logActivity } from "@/lib/activity";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    await requireUser();
    const vendor = await prisma.vendor.findUnique({
      where: { id: params.id },
      include: { quotations: { include: { rfq: true } }, purchaseOrders: true },
    });
    if (!vendor) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    return NextResponse.json({ vendor });
  } catch (e) { return err(e); }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(["ADMIN", "BUYER"]);
    const body = await req.json();
    const isBlacklisted = body.isBlacklisted !== undefined ? Boolean(body.isBlacklisted) : body.status === "BLACKLISTED" ? true : undefined;
    const nextStatus = isBlacklisted === true ? "BLACKLISTED" : body.status;

    const vendor = await prisma.vendor.update({
      where: { id: params.id },
      data: {
        name: body.name, category: body.category, gstNumber: body.gstNumber,
        contactName: body.contactName, phone: body.phone, address: body.address,
        status: nextStatus, isBlacklisted, rating: body.rating !== undefined ? Number(body.rating) : undefined,
      },
    });
    await logActivity({ userId: user.id, action: "UPDATE", entityType: "Vendor", entityId: vendor.id, message: `Vendor "${vendor.name}" updated (Blacklisted: ${vendor.isBlacklisted})` });
    return NextResponse.json({ vendor });
  } catch (e) { return err(e); }
}

function err(e: unknown) {
  if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
  console.error(e); return NextResponse.json({ error: "Server error" }, { status: 500 });
}
