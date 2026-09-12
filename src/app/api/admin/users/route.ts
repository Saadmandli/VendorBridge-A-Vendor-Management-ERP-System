import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/rbac";
import { logActivity } from "@/lib/activity";

export async function GET(req: Request) {
  try {
    await requireUser(["ADMIN"]);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "";
    const role = searchParams.get("role") || "";

    const users = await prisma.user.findMany({
      where: {
        AND: [
          status ? { status: status as any } : {},
          role ? { role: role as any } : {},
        ],
      },
      include: {
        vendor: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("Admin GET users error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const admin = await requireUser(["ADMIN"]);
    const { userId, status } = await req.json();

    if (!userId || !status || !["APPROVED", "REJECTED", "PENDING"].includes(status)) {
      return NextResponse.json({ error: "Invalid userId or status" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (targetUser?.email === "admin@vendorbridge.com" && status !== "APPROVED") {
      return NextResponse.json(
        { error: "The default demo Main Admin account is protected and cannot be disabled." },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status: status as any },
      include: { vendor: true },
    });

    // If user has associated vendor record, update vendor status as well
    if (updatedUser.vendorId) {
      const vendorStatus = status === "APPROVED" ? "ACTIVE" : status === "REJECTED" ? "INACTIVE" : "PENDING";
      await prisma.vendor.update({
        where: { id: updatedUser.vendorId },
        data: { status: vendorStatus as any },
      });
    }

    await logActivity({
      userId: admin.id,
      action: "UPDATE",
      entityType: "User",
      entityId: updatedUser.id,
      message: `Admin updated user "${updatedUser.name}" (${updatedUser.role}) status to ${status}`,
    });

    return NextResponse.json({ ok: true, user: updatedUser });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("Admin PATCH users error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await requireUser(["ADMIN"]);
    const { name, email, password, role, city, vendorName, category, subcategory } = await req.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: "Name, email, password, and role are required" }, { status: 400 });
    }

    const lcEmail = String(email).toLowerCase();
    const exists = await prisma.user.findUnique({ where: { email: lcEmail } });
    if (exists) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 });
    }

    const { hashPassword } = await import("@/lib/auth");
    const passwordHash = await hashPassword(password);
    let finalRole = role === "ADMIN" ? "ADMIN" : role === "SELLER" ? "SELLER" : "BUYER";
    let vendorId: string | undefined;

    if (finalRole === "SELLER") {
      const vendor = await prisma.vendor.create({
        data: {
          name: vendorName || name,
          category: category || "General",
          subcategory: subcategory || null,
          email: lcEmail,
          city: city ? String(city).trim() : null,
          status: "ACTIVE",
        },
      });
      vendorId = vendor.id;
    }

    const newUser = await prisma.user.create({
      data: {
        name,
        email: lcEmail,
        passwordHash,
        role: finalRole as any,
        status: "APPROVED",
        city: city ? String(city).trim() : null,
        vendorId,
      },
      include: { vendor: true },
    });

    await logActivity({
      userId: admin.id,
      action: "CREATE",
      entityType: "User",
      entityId: newUser.id,
      message: `Main Admin created approved account for ${newUser.name} (${newUser.role})`,
    });

    return NextResponse.json({ ok: true, user: newUser }, { status: 201 });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("Admin POST users error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
