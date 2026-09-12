import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-insecure-secret-change-me-in-env-file-please"
);

const PUBLIC = ["/login", "/signup", "/forgot-password", "/pending-approval", "/admin/login", "/admin/signup"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("vb_session")?.value;
  let valid = false;
  let payload: any = null;

  if (token) {
    try {
      const res = await jwtVerify(token, secret);
      payload = res.payload;
      valid = true;
    } catch {
      valid = false;
    }
  }

  const isPublic = PUBLIC.some((p) => pathname.startsWith(p));

  if (!valid && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (valid) {
    const isPending = payload?.status === "PENDING" || payload?.status === "REJECTED";

    if (isPending && pathname !== "/pending-approval") {
      const url = req.nextUrl.clone();
      url.pathname = "/pending-approval";
      return NextResponse.redirect(url);
    }

    if (!isPending && isPublic) {
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
