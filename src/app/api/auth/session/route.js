import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, parseSessionCookie } from "@/lib/auth";

/**
 * GET /api/auth/session
 * Returns the current server-side session from the cookie.
 * Used by client components that need to know the current user's role
 * without relying solely on localStorage.
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE);
    const session = parseSessionCookie(sessionCookie?.value);

    if (!session) {
      return NextResponse.json({ authenticated: false, session: null });
    }

    return NextResponse.json({ authenticated: true, session });
  } catch (error) {
    console.error("GET /api/auth/session error:", error);
    return NextResponse.json({ authenticated: false, session: null });
  }
}
