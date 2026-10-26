import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDbPool, initDatabase } from "@/lib/db";
import { SESSION_COOKIE, parseSessionCookie } from "@/lib/auth";

/**
 * GET /api/crm/leads
 * Returns leads scoped to the current user's role.
 * This is used by the CRM leads page for server-side scoping.
 *
 * Admin/BM: All leads
 * UnitHead: Leads for counsellors in their unit
 * Counsellor: Only their own assigned leads
 */
export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    await initDatabase();
    const db = getDbPool();

    // First try request.cookies (often more reliable in edge/Next.js API routes)
    let sessionCookieValue = request.cookies.get(SESSION_COOKIE)?.value;
    
    // Fallback to cookies()
    if (!sessionCookieValue) {
      const cookieStore = await cookies();
      sessionCookieValue = cookieStore.get(SESSION_COOKIE)?.value;
    }

    let session = parseSessionCookie(sessionCookieValue);

    // Support client session header fallback
    if (!session) {
      const customHeader = request.headers.get("x-user-session");
      if (customHeader) {
        try {
          session = JSON.parse(decodeURIComponent(customHeader));
        } catch {}
      }
    }

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { role, unit_id: sessionUnitId, id: userId, name: userName } = session;

    let whereClause = "";
    let params = [];

    if (role === "Admin") {
      // Admin: View all leads system-wide
      whereClause = "";
    } else if (role === "UnitHead") {
      // Unit Head: View all leads assigned to counsellors mapped under their unit,
      // plus unassigned leads belonging to their unit.
      const [unitRows] = await db.query(
        "SELECT id, name FROM units WHERE head_user_id = ? OR id = ?",
        [userId, sessionUnitId || 0]
      );

      const unitIds = unitRows.map((u) => u.id);
      const unitNames = unitRows.map((u) => u.name);

      let counsellorNames = [];
      if (unitIds.length > 0) {
        const [counsellors] = await db.query(
          `SELECT name FROM users WHERE unit_id IN (${unitIds.map(() => "?").join(", ")}) AND role = 'Counsellor'`,
          unitIds
        );
        counsellorNames = counsellors.map((c) => c.name);
      }

      const orConditions = [];

      // Leads assigned to counsellors mapped under their unit
      if (counsellorNames.length > 0) {
        const ph = counsellorNames.map(() => "?").join(", ");
        orConditions.push(`counsellor IN (${ph})`);
        params.push(...counsellorNames);
      }

      // Unassigned leads belonging to their unit (by unit_id or center name)
      if (unitIds.length > 0) {
        const idPh = unitIds.map(() => "?").join(", ");
        const namePh = unitNames.map(() => "?").join(", ");
        orConditions.push(
          `((unit_id IN (${idPh}) OR center IN (${namePh})) AND (counsellor IS NULL OR counsellor = '' OR counsellor = 'Unassigned'))`
        );
        params.push(...unitIds, ...unitNames);
      }

      if (orConditions.length > 0) {
        whereClause = `WHERE (${orConditions.join(" OR ")})`;
      } else {
        return NextResponse.json({ success: true, leads: [] });
      }
    } else if (role === "Counsellor") {
      // Counselor: Strictly only leads assigned to their own bucket.
      // Absolutely no other counselors' leads or unassigned leads.
      whereClause = "WHERE counsellor = ?";
      params = [userName];
    } else {
      return NextResponse.json({ success: false, error: "Forbidden role" }, { status: 403 });
    }

    const [rows] = await db.query(
      `SELECT * FROM leads ${whereClause} ORDER BY punchDate DESC`,
      params
    );

    const formatted = rows.map(formatLeadRow);
    return NextResponse.json({ success: true, leads: formatted });
  } catch (error) {
    console.error("GET /api/crm/leads error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

function formatLeadRow(row) {
  const parseJson = (val) => {
    if (!val) return [];
    if (typeof val === "object") return val;
    try { return JSON.parse(val); }
    catch { return []; }
  };
  return {
    ...row,
    punchDate: row.punchDate ? new Date(row.punchDate).toISOString() : new Date().toISOString(),
    notes: parseJson(row.notes),
    followUps: parseJson(row.followUps),
    timeline: parseJson(row.timeline),
  };
}
