import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDbPool, initDatabase } from "@/lib/db";
import { SESSION_COOKIE, parseSessionCookie } from "@/lib/auth";

/**
 * GET /api/crm/dashboard
 * Returns lead statistics scoped to the current user's role.
 *
 * Scoping rules:
 *   Admin → all leads
 *   UnitHead → leads where the assigned counsellor belongs to their unit
 *   Counsellor → only leads assigned to themselves
 */
export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    await initDatabase();
    const db = getDbPool();

    // Read session from cookie, try request.cookies first
    let sessionCookieValue = request.cookies.get(SESSION_COOKIE)?.value;
    if (!sessionCookieValue) {
      const cookieStore = await cookies();
      sessionCookieValue = cookieStore.get(SESSION_COOKIE)?.value;
    }
    let session = parseSessionCookie(sessionCookieValue);
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

    const { role, id: userId, unit_id: sessionUnitId, name: userName } = session;

    let whereClause = "";
    let params = [];

    if (role === "Admin") {
      // See all leads
      whereClause = "";
    } else if (role === "UnitHead") {
      const [unitRows] = await db.query(
        "SELECT id, name FROM units WHERE head_user_id = ? OR id = ?",
        [userId, sessionUnitId || 0]
      );
      const unitIds = unitRows.map((u) => u.id);
      const unitNames = unitRows.map((u) => u.name);

      let counsellorNames = [];
      if (unitIds.length > 0) {
        const [counsellorRows] = await db.query(
          `SELECT name FROM users WHERE unit_id IN (${unitIds.map(() => "?").join(", ")}) AND role = 'Counsellor'`,
          unitIds
        );
        counsellorNames = counsellorRows.map((r) => r.name);
      }

      const orConditions = [];
      if (counsellorNames.length > 0) {
        const ph = counsellorNames.map(() => "?").join(", ");
        orConditions.push(`counsellor IN (${ph})`);
        params.push(...counsellorNames);
      }
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
        return NextResponse.json({ success: true, stats: emptyStats() });
      }
    } else if (role === "Counsellor") {
      // Only their own assigned leads
      whereClause = "WHERE counsellor = ?";
      params = [userName];
    }

    // Aggregate query
    const [rows] = await db.query(
      `SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN DATE(punchDate) = CURDATE() THEN 1 ELSE 0 END) AS todayLeads,
        SUM(CASE WHEN status = 'New Lead' THEN 1 ELSE 0 END) AS newLeads,
        SUM(CASE WHEN status = 'Hot' THEN 1 ELSE 0 END) AS hotLeads,
        SUM(CASE WHEN status = 'Warm' THEN 1 ELSE 0 END) AS warmLeads,
        SUM(CASE WHEN status = 'Cold' THEN 1 ELSE 0 END) AS coldLeads,
        SUM(CASE WHEN status = 'Attempting to call' THEN 1 ELSE 0 END) AS attemptingCall,
        SUM(CASE WHEN status = 'Follow up for Next Batch' THEN 1 ELSE 0 END) AS followUpBatch,
        SUM(CASE WHEN status = 'Registration Paid' THEN 1 ELSE 0 END) AS registrationPaid,
        SUM(CASE WHEN status = 'Fees Collected' THEN 1 ELSE 0 END) AS feesPaid,
        SUM(CASE WHEN status = 'Admission Approved' THEN 1 ELSE 0 END) AS admissionApproved,
        SUM(CASE WHEN status IN ('Dropped Not Interested', 'Closed Lost') THEN 1 ELSE 0 END) AS dropped,
        SUM(CASE WHEN leadType = 'Primary' THEN 1 ELSE 0 END) AS primaryLeads,
        SUM(CASE WHEN leadType = 'Duplicate' THEN 1 ELSE 0 END) AS duplicateLeads
      FROM leads ${whereClause}`,
      params
    );

    const row = rows[0] || {};
    const total = Number(row.total) || 0;
    const admitted = Number(row.admissionApproved) || 0;
    const conversionRate = total > 0 ? ((admitted / total) * 100).toFixed(1) : "0.0";

    return NextResponse.json({
      success: true,
      stats: {
        total,
        todayLeads: Number(row.todayLeads) || 0,
        newLeads: Number(row.newLeads) || 0,
        hotLeads: Number(row.hotLeads) || 0,
        warmLeads: Number(row.warmLeads) || 0,
        coldLeads: Number(row.coldLeads) || 0,
        attemptingCall: Number(row.attemptingCall) || 0,
        followUpBatch: Number(row.followUpBatch) || 0,
        registrationPaid: Number(row.registrationPaid) || 0,
        feesPaid: Number(row.feesPaid) || 0,
        admissionApproved: admitted,
        dropped: Number(row.dropped) || 0,
        primaryLeads: Number(row.primaryLeads) || 0,
        duplicateLeads: Number(row.duplicateLeads) || 0,
        conversionRate,
      },
    });
  } catch (error) {
    console.error("GET /api/crm/dashboard error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

function emptyStats() {
  return {
    total: 0, todayLeads: 0, newLeads: 0, hotLeads: 0, warmLeads: 0,
    coldLeads: 0, attemptingCall: 0, followUpBatch: 0, registrationPaid: 0,
    feesPaid: 0, admissionApproved: 0, dropped: 0, primaryLeads: 0,
    duplicateLeads: 0, conversionRate: "0.0",
  };
}
