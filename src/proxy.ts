import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

// Next.js 16 renamed `middleware` to `proxy`. Guards the merchant area and
// keeps signed-in merchants out of the auth screens.

const PROTECTED = ["/dashboard", "/onboarding", "/admin"];
const AUTH_PAGES = ["/login", "/signup"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);

  const isProtected = PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  const isAuthPage = AUTH_PAGES.some((p) => pathname === p);

  if (isProtected && !session) {
    const url = new URL("/login", request.url);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && session) {
    const url = new URL("/dashboard", request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding",
    "/admin/:path*",
    "/login",
    "/signup",
  ],
};
