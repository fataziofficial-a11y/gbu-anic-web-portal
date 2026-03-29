import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import type { NextRequest } from "next/server";

type AuthenticatedRequest = NextRequest & { auth: Session | null };

// Rate limiting for login endpoint
const loginAttempts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_ATTEMPTS = 5;

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of loginAttempts) {
    if (now > value.resetTime) {
      loginAttempts.delete(key);
    }
  }
}, 5 * 60 * 1000);

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export default auth((req: AuthenticatedRequest) => {
  const isLoggedIn = !!req.auth;
  const path = req.nextUrl.pathname;

  // Rate limit login attempts (covers all auth-related POST endpoints)
  const isAuthPost =
    req.method === "POST" &&
    (path === "/api/auth/callback/credentials" ||
      path === "/api/auth/signin" ||
      path === "/api/auth/signin/credentials");

  if (isAuthPost) {
    const ip = getClientIp(req);
    const now = Date.now();
    const entry = loginAttempts.get(ip);

    if (entry && now < entry.resetTime) {
      if (entry.count >= MAX_ATTEMPTS) {
        return NextResponse.json(
          { error: "Слишком много попыток входа. Попробуйте через минуту." },
          { status: 429 }
        );
      }
      entry.count++;
    } else {
      loginAttempts.set(ip, {
        count: 1,
        resetTime: now + RATE_LIMIT_WINDOW_MS,
      });
    }
  }

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
  matcher: ["/admin/:path*", "/api/auth/:path*"],
};
