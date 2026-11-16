import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

// Next.js 16 renamed `middleware` to `proxy`. Guards the merchant area.
// /login and /signup always show their forms, even to someone logged in, so
// "Log in" and "Open your shop free" never skip straight into store setup.

const PROTECTED = ["/dashboard", "/onboarding", "/admin"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);

  const isProtected = PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (isProtected && !session) {
    // Building a store starts with an account: sign up (or log in) first.
    const to = pathname.startsWith("/onboarding") ? "/signup" : "/login";
    return NextResponse.redirect(new URL(to, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding",
    "/admin/:path*",
  ],
};
