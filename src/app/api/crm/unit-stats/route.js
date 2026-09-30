import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDbPool, initDatabase } from "@/lib/db";
import { SESSION_COOKIE, parseSessionCookie } from "@/lib/auth";

/**
 * GET /api/crm/unit-stats
 * Returns per-unit lead statistics.
 * Stats are keyed by unit_id (matched via counsellors' unit_id + leads.counsellor name).
 */
export async function GET() {
  try {
    await initDatabase();
    const db = getDbPool();

    const cookieStore = await cookies();
    const session = parseSessionCookie(cookieStore.get(SESSION_COOKIE)?.value);

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { role } = session;

    // Only Admin and BusinessManager can view all units
    if (role !== "Admin" && role !== "BusinessManager") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // Get counsellors with their unit assignments
    const [counsellorRows] = await db.query(
      "SELECT id, name, unit_id FROM users WHERE role = 'Counsellor' AND unit_id IS NOT NULL"
    );

    // Build a map of counsellor name -> unit_id
    const counsellorUnitMap = {};
    for (const c of counsellorRows) {
      counsellorUnitMap[c.name] = c.unit_id;
    }

    // Aggregate leads per counsellor
    const [leadRows] = await db.query(
      `SELECT
        counsellor,
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'Admission Approved' THEN 1 ELSE 0 END) AS admitted,
        SUM(CASE WHEN status = 'Hot' THEN 1 ELSE 0 END) AS hot,
        SUM(CASE WHEN status = 'Registration Paid' THEN 1 ELSE 0 END) AS registrationPaid,
        SUM(CASE WHEN status = 'Fees Collected' THEN 1 ELSE 0 END) AS feesPaid,
        SUM(CASE WHEN DATE(punchDate) = CURDATE() THEN 1 ELSE 0 END) AS todayLeads
      FROM leads
      GROUP BY counsellor`
    );

    // Aggregate per unit_id
    const unitStats = {};
    for (const row of leadRows) {
      const unitId = counsellorUnitMap[row.counsellor];
      if (!unitId) continue;

      if (!unitStats[unitId]) {
        unitStats[unitId] = {
          total: 0, admitted: 0, hot: 0, registrationPaid: 0, feesPaid: 0, todayLeads: 0,
        };
      }
      unitStats[unitId].total += Number(row.total) || 0;
      unitStats[unitId].admitted += Number(row.admitted) || 0;
      unitStats[unitId].hot += Number(row.hot) || 0;
      unitStats[unitId].registrationPaid += Number(row.registrationPaid) || 0;
      unitStats[unitId].feesPaid += Number(row.feesPaid) || 0;
      unitStats[unitId].todayLeads += Number(row.todayLeads) || 0;
    }

    return NextResponse.json({ success: true, stats: unitStats });
  } catch (error) {
    console.error("GET /api/crm/unit-stats error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
