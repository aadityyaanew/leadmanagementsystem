import { NextResponse } from "next/server";
import { SESSION_COOKIE, parseSessionCookie } from "@/lib/auth";

/**
 * Next.js 16 Proxy (formerly Middleware) - server-side route protection.
 *
 * Route access rules:
 *   /admin/dashboard → Admin only (role === 'Admin')
 *   /admin/crm       → Admin only
 *   /crm/units       → Admin or BusinessManager
 *   /crm/counsellors → Admin, BusinessManager, or UnitHead
 *   /crm/*           → Any authenticated user
 *   /profile         → Any authenticated user
 *   /login, /        → Unauthenticated only
 */
export function proxy(request) {
  const { pathname } = request.nextUrl;
  const sessionCookieValue = request.cookies.get(SESSION_COOKIE)?.value;
  const session = parseSessionCookie(sessionCookieValue);

  const isAuthenticated = Boolean(session);
  const role = session?.role || null;

  // ── Public routes: redirect authenticated users ──────────────────────────
  if (pathname === "/" || pathname === "/login" || pathname === "/admin") {
    if (isAuthenticated) {
      if (role === "Admin") {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      } else {
        return NextResponse.redirect(new URL("/crm/dashboard", request.url));
      }
    }
    return NextResponse.next();
  }

  // ── All protected routes: require authentication ─────────────────────────
  // Note: /admin exact match is handled above. This catches /admin/dashboard, etc.
  const isProtected =
    pathname.startsWith("/crm") ||
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/profile");

  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!isAuthenticated) return NextResponse.next();

  // ── Admin-only routes ───────────────────────────────────────────────────
  if (pathname.startsWith("/admin/dashboard")) {
    if (role !== "Admin") {
      return NextResponse.redirect(new URL("/crm/dashboard", request.url));
    }
  }

  if (pathname.startsWith("/admin/crm")) {
    if (role !== "Admin") {
      return NextResponse.redirect(new URL("/crm/dashboard", request.url));
    }
  }

  // ── Admins accessing /crm → redirect to /admin/crm ─────────────────────
  if (pathname.startsWith("/crm") && role === "Admin") {
    return NextResponse.redirect(new URL("/admin/crm", request.url));
  }

  // ── CRM sub-route access control ────────────────────────────────────────
  if (pathname.startsWith("/crm/units")) {
    if (role !== "BusinessManager" && role !== "Admin") {
      return NextResponse.redirect(new URL("/crm/dashboard", request.url));
    }
  }

  if (pathname.startsWith("/crm/counsellors")) {
    if (role === "Counsellor") {
      return NextResponse.redirect(new URL("/crm/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/|_next/static|_next/image|favicon.ico|logo|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)).*)",
  ],
};
