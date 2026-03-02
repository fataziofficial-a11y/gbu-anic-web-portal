import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import type { NextRequest } from "next/server";

type AuthenticatedRequest = NextRequest & { auth: Session | null };

export default auth((req: AuthenticatedRequest) => {
  const isLoggedIn = !!req.auth;
  const path = req.nextUrl.pathname;

  const isLoginPage = path === "/admin/login";
  const isAdminRoute = path.startsWith("/admin");

  if (isAdminRoute && !isLoginPage && !isLoggedIn) {
    const loginUrl = new URL("/admin/login", req.nextUrl);
    loginUrl.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoginPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/admin", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
