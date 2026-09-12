import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { validateEmail, validatePassword } from "@/lib/validation";
import type { Role } from "@prisma/client";

const ALLOWED: Role[] = ["BUYER", "SELLER", "ADMIN"];

export async function POST(req: Request) {
  try {
    const { name, email, password, role, city, vendorName, category, subcategory } = await req.json().catch(() => ({}));
    if (!name || !email || !password)
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });

    const trimmedName = String(name).trim();
    const lcEmail = String(email).toLowerCase().trim();

    if (!validateEmail(lcEmail)) {
      return NextResponse.json({ error: "Invalid email address format (e.g. name@company.com)" }, { status: 400 });
    }

    const passCheck = validatePassword(String(password));
    if (!passCheck.isValid) {
      return NextResponse.json(
        { error: `Weak password: ${passCheck.errors.join(", ")}` },
        { status: 400 }
      );
    }

    const exists = await prisma.user.findUnique({ where: { email: lcEmail } });
    if (exists) return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });

    const totalUsers = await prisma.user.count();
    const isBootstrapAdmin = totalUsers === 0 && role === "ADMIN";
    const finalRole: Role = role === "ADMIN" ? "ADMIN" : role === "SELLER" ? "SELLER" : "BUYER";
    const userStatus = isBootstrapAdmin ? "APPROVED" : "PENDING";

    const passwordHash = await hashPassword(password);
    const userCity = city ? String(city).trim() : null;

    let vendorId: string | undefined;
    if (finalRole === "SELLER") {
      const vendor = await prisma.vendor.create({
        data: {
          name: vendorName || trimmedName,
          category: category || "General",
          subcategory: subcategory || null,
          email: lcEmail,
          city: userCity,
          status: "PENDING",
        },
      });
      vendorId = vendor.id;
    }

    const user = await prisma.user.create({
      data: {
        name: trimmedName,
        email: lcEmail,
        passwordHash,
        role: finalRole,
        status: userStatus,
        city: userCity,
        vendorId,
      },
    });

    await createSession({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      city: user.city,
      vendorId: user.vendorId,
    });

    await logActivity({
      userId: user.id,
      action: "SIGNUP",
      entityType: "User",
      entityId: user.id,
      message: `${user.name} signed up as ${user.role} (Status: ${user.status})`,
    });

    if (finalRole === "ADMIN" && userStatus === "PENDING") {
      try {
        const activeAdmins = await prisma.user.findMany({
          where: { role: "ADMIN", status: "APPROVED" },
          select: { id: true },
        });
        if (activeAdmins.length > 0) {
          await prisma.notification.createMany({
            data: activeAdmins.map((admin) => ({
              userId: admin.id,
              type: "ADMIN_APPROVAL_REQUEST",
              message: `New Admin registration request from ${trimmedName} (${lcEmail}) awaiting your approval.`,
              link: "/admin/users",
            })),
          });
        }
      } catch (notifErr) {
        console.error("Failed to notify admins of new admin request:", notifErr);
      }
    }

    return NextResponse.json({ ok: true, role: user.role, status: user.status });
  } catch (e) {
    console.error("signup error:", e);
    return NextResponse.json({ error: "Signup failed — server error." }, { status: 500 });
  }
}
