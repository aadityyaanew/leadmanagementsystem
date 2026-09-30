import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDbPool, initDatabase } from "@/lib/db";
import { SESSION_COOKIE, parseSessionCookie } from "@/lib/auth";

/**
 * GET /api/crm/counsellor-stats
 * Returns per-counsellor lead statistics scoped to the session user's role.
 * Returns an object keyed by counsellor name with their lead counts.
 */
export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    await initDatabase();
    const db = getDbPool();

    let sessionCookieValue = request.cookies.get(SESSION_COOKIE)?.value;
    if (!sessionCookieValue) {
      const cookieStore = await cookies();
      sessionCookieValue = cookieStore.get(SESSION_COOKIE)?.value;
    }
    const session = parseSessionCookie(sessionCookieValue);

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
          return NextResponse.json({ success: true, stats: {} });
        }
      } else {
        whereClause = "WHERE counsellor = ?";
        params = [userName];
      }
    } else {
      // Counsellors don't access this page, but just in case
      whereClause = "WHERE counsellor = ?";
      params = [userName];
    }

    const [rows] = await db.query(
      `SELECT
        counsellor,
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'Hot' THEN 1 ELSE 0 END) AS hot,
        SUM(CASE WHEN status = 'Admission Approved' THEN 1 ELSE 0 END) AS admitted,
        SUM(CASE WHEN status = 'Registration Paid' THEN 1 ELSE 0 END) AS registrationPaid,
        SUM(CASE WHEN status = 'Fees Collected' THEN 1 ELSE 0 END) AS feesPaid,
        SUM(CASE WHEN DATE(punchDate) = CURDATE() THEN 1 ELSE 0 END) AS todayLeads
      FROM leads ${whereClause}
      GROUP BY counsellor`,
      params
    );

    // Build stats map keyed by counsellor name
    const stats = {};
    for (const row of rows) {
      if (row.counsellor) {
        stats[row.counsellor] = {
          total: Number(row.total) || 0,
          hot: Number(row.hot) || 0,
          admitted: Number(row.admitted) || 0,
          registrationPaid: Number(row.registrationPaid) || 0,
          feesPaid: Number(row.feesPaid) || 0,
          todayLeads: Number(row.todayLeads) || 0,
        };
      }
    }

    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error("GET /api/crm/counsellor-stats error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
