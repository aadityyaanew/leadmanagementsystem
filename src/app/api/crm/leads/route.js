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
export async function GET(request) {
  try {
    await initDatabase();
    const db = getDbPool();

    const cookieStore = await cookies();
    const session = parseSessionCookie(cookieStore.get(SESSION_COOKIE)?.value);

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { role, unit_id, name: userName } = session;

    let whereClause = "";
    let params = [];

    if (role === "Admin" || role === "BusinessManager") {
      whereClause = "";
    } else if (role === "UnitHead") {
      if (unit_id) {
        const [counsellorRows] = await db.query(
          "SELECT name FROM users WHERE unit_id = ? AND role = 'Counsellor' AND is_active = 1",
          [unit_id]
        );
        if (counsellorRows.length > 0) {
          const names = counsellorRows.map((r) => r.name);
          const placeholders = names.map(() => "?").join(", ");
          whereClause = `WHERE counsellor IN (${placeholders})`;
          params = names;
        } else {
          return NextResponse.json({ success: true, leads: [] });
        }
      } else {
        whereClause = "WHERE counsellor = ?";
        params = [userName];
      }
    } else if (role === "Counsellor") {
      whereClause = "WHERE (counsellor = ? OR counsellor IS NULL OR counsellor = '' OR counsellor = 'Unassigned')";
      params = [userName];
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
