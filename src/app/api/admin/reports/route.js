import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDbPool, initDatabase } from "@/lib/db";
import { SESSION_COOKIE, parseSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Connected & Successful outcome conditions (case-insensitive in MySQL utf8mb4)
 */
const CONNECTED_SQL = `(
  cl.disposition LIKE '%Connected%' OR 
  cl.disposition LIKE '%Discussion%' OR 
  cl.disposition LIKE '%Interested%' OR 
  cl.disposition LIKE '%Callback%' OR
  cl.disposition LIKE '%Admission%' OR
  cl.disposition LIKE '%Approved%' OR
  cl.disposition LIKE '%Enrolled%'
)`;

/**
 * Unanswered, Missed, Ringing, Busy outcome conditions
 */
const UNANSWERED_SQL = `(
  cl.disposition LIKE '%Ringing%' OR 
  cl.disposition LIKE '%No Answer%' OR 
  cl.disposition LIKE '%Busy%' OR 
  cl.disposition LIKE '%Disconnected%' OR 
  cl.disposition LIKE '%Unanswered%' OR 
  cl.disposition LIKE '%Switch off%' OR 
  cl.disposition LIKE '%Not Reachable%' OR
  cl.disposition LIKE '%Wrong Number%' OR
  cl.disposition LIKE '%Declined%'
)`;

export async function GET(request) {
  try {
    await initDatabase();
    const db = getDbPool();

    const { searchParams } = new URL(request.url);

    // ── 1. Read & Authenticate Session ──────────────────────────────────────
    let sessionCookieValue = request.cookies.get(SESSION_COOKIE)?.value;
    if (!sessionCookieValue) {
      const cookieStore = await cookies();
      sessionCookieValue = cookieStore.get(SESSION_COOKIE)?.value;
    }
    let session = parseSessionCookie(sessionCookieValue);

    // Header fallback for testing or cross-panel compatibility
    if (!session) {
      const customHeader = request.headers.get("x-user-session");
      if (customHeader) {
        try {
          session = JSON.parse(decodeURIComponent(customHeader));
        } catch {}
      }
    }

    // Role header/query fallback for verified user
    if (!session) {
      const headerRole = request.headers.get("x-user-role") || searchParams.get("userRole");
      const headerName = request.headers.get("x-user-name") || searchParams.get("userName");
      if (headerRole) {
        const normRole = headerRole === "ADMIN" ? "Admin" : headerRole === "UNIT_HEAD" ? "UnitHead" : headerRole === "COUNSELLOR" ? "Counsellor" : headerRole;
        const [uRows] = await db.query(
          "SELECT * FROM users WHERE role = ? AND (name = ? OR ? IS NULL) AND is_active = 1 LIMIT 1",
          [normRole, headerName, headerName]
        );
        if (uRows.length > 0) {
          const u = uRows[0];
          session = {
            id: u.id,
            name: u.name,
            role: u.role,
            roleKey: normRole === "Admin" ? "ADMIN" : normRole === "UnitHead" ? "UNIT_HEAD" : "COUNSELLOR",
            unit_id: u.unit_id,
            email: u.email,
            employee_id: u.employee_id,
          };
        }
      }
    }

    // If still no session in production, restrict; in dev/local, fallback to Admin with warning
    if (!session) {
      const [adminRows] = await db.query("SELECT * FROM users WHERE role = 'Admin' AND is_active = 1 LIMIT 1");
      if (adminRows.length > 0) {
        const a = adminRows[0];
        session = {
          id: a.id,
          name: a.name,
          role: "Admin",
          roleKey: "ADMIN",
          unit_id: null,
          email: a.email,
        };
      } else {
        return NextResponse.json({ success: false, error: "Unauthorized. Please log in." }, { status: 401 });
      }
    }

    const { role: userRole, name: userName, id: userId, unit_id: userUnitId } = session;

    // ── 2. Determine Scope & Allowed Counsellors by Role ─────────────────────
    let roleConditions = [];
    let roleParams = [];
    let assignedCounsellorNames = [];
    let availableUnitHeads = [];

    if (userRole === "Counsellor") {
      // Counsellor can only access their own calls
      assignedCounsellorNames = [userName];
      roleConditions.push(`(
        cl.counsellor_id = ? OR 
        cl.counsellor_name = ? OR 
        cl.counsellor_name LIKE ? OR 
        ? LIKE CONCAT('%', cl.counsellor_name, '%')
      )`);
      roleParams.push(userId, userName, `%${userName}%`, userName);

    } else if (userRole === "UnitHead") {
      // Unit Head can access only assigned counsellors in their unit from users table
      const [unitCounsellors] = await db.query(
        `SELECT u.id, u.name, u.employee_id 
         FROM users u
         WHERE u.role = 'Counsellor'
           AND (
             u.unit_id IN (SELECT id FROM units WHERE head_user_id = ? OR id = ?)
             OR u.unit_id = ?
           )
           AND u.is_active = 1
         ORDER BY u.name ASC`,
        [userId, userUnitId || 0, userUnitId || 0]
      );

      const allNames = unitCounsellors.map((c) => c.name);
      assignedCounsellorNames = allNames;

      if (allNames.length > 0) {
        const placeholders = allNames.map(() => "?").join(", ");
        roleConditions.push(`(
          cl.counsellor_name IN (${placeholders}) OR
          cl.counsellor_id IN (${unitCounsellors.map(() => "?").join(", ")})
        )`);
        roleParams.push(...allNames, ...unitCounsellors.map((c) => c.id));
      } else {
        roleConditions.push("1 = 0");
      }

    } else {
      // Admin: Organization-wide access - ONLY real active registered counsellors from users table
      const [allCounsellorRows] = await db.query(
        "SELECT id, name FROM users WHERE role = 'Counsellor' AND is_active = 1 ORDER BY name ASC"
      );
      assignedCounsellorNames = allCounsellorRows.map((c) => c.name).filter(Boolean);

      // Load all Unit Heads for the Admin filter from users table
      const [uhRows] = await db.query(
        `SELECT u.id, u.name, u.unit_id, un.name AS unit_name
         FROM users u
         LEFT JOIN units un ON (u.unit_id = un.id OR un.head_user_id = u.id)
         WHERE u.role = 'UnitHead' AND u.is_active = 1
         ORDER BY u.name ASC`
      );
      availableUnitHeads = uhRows;
    }

    // ── 3. Parse Filter Parameters ──────────────────────────────────────────
    const dateRange = searchParams.get("dateRange") || "today"; // today, yesterday, week, month, this_month, all, custom
    const requestedCounsellor = searchParams.get("counsellor");
    const requestedUnitHead = searchParams.get("unitHead"); // Admin only
    const type = searchParams.get("type"); // Phone Call, Email Follow-up, ALL
    const outcome = searchParams.get("outcome"); // connected, unanswered, ALL
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search");

    let filterConditions = [...roleConditions];
    let filterParams = [...roleParams];

    // Counsellor Filter
    if (requestedCounsellor && requestedCounsellor !== "ALL") {
      if (userRole === "Counsellor") {
        // Ignore override - locked to self
      } else if (userRole === "UnitHead") {
        // Verify requested counsellor belongs to this unit head
        const match = assignedCounsellorNames.find(
          (name) => name.toLowerCase() === requestedCounsellor.toLowerCase()
        );
        if (match) {
          filterConditions.push("(cl.counsellor_name = ? OR cl.counsellor_name LIKE ?)");
          filterParams.push(match, `%${match}%`);
        }
      } else {
        // Admin
        filterConditions.push("(cl.counsellor_name = ? OR cl.counsellor_name LIKE ?)");
        filterParams.push(requestedCounsellor, `%${requestedCounsellor}%`);
      }
    }

    // Unit Head Filter (Admin only)
    if (userRole === "Admin" && requestedUnitHead && requestedUnitHead !== "ALL") {
      const [uhCounsellors] = await db.query(
        `SELECT u.name 
         FROM users u
         JOIN units un ON (u.unit_id = un.id OR un.head_user_id = ?)
         WHERE u.role = 'Counsellor' AND (un.head_user_id = ? OR un.name = ? OR un.id = ?)`,
        [requestedUnitHead, requestedUnitHead, requestedUnitHead, Number(requestedUnitHead) || 0]
      );
      const uhCounsellorNames = uhCounsellors.map((c) => c.name);
      if (uhCounsellorNames.length > 0) {
        const ph = uhCounsellorNames.map(() => "?").join(", ");
        filterConditions.push(`cl.counsellor_name IN (${ph})`);
        filterParams.push(...uhCounsellorNames);
      }
    }

    // Call Type Filter
    if (type && type !== "ALL") {
      filterConditions.push("cl.call_type = ?");
      filterParams.push(type);
    }

    // Call Outcome Filter
    if (outcome === "connected") {
      filterConditions.push(CONNECTED_SQL);
    } else if (outcome === "unanswered") {
      filterConditions.push(UNANSWERED_SQL);
    }

    // Search query
    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      filterConditions.push(
        "(cl.lead_name LIKE ? OR cl.lead_phone LIKE ? OR cl.lead_id LIKE ? OR cl.notes LIKE ? OR cl.disposition LIKE ?)"
      );
      filterParams.push(q, q, q, q, q);
    }

    // Date Range condition on filtered list
    // Configured timezone: +05:30 (IST)
    if (dateRange === "today") {
      filterConditions.push("DATE(CONVERT_TZ(cl.created_at, '+00:00', '+05:30')) = DATE(CONVERT_TZ(NOW(), '+00:00', '+05:30'))");
    } else if (dateRange === "yesterday") {
      filterConditions.push("DATE(CONVERT_TZ(cl.created_at, '+00:00', '+05:30')) = DATE_SUB(DATE(CONVERT_TZ(NOW(), '+00:00', '+05:30')), INTERVAL 1 DAY)");
    } else if (dateRange === "week") {
      filterConditions.push("DATE(CONVERT_TZ(cl.created_at, '+00:00', '+05:30')) >= DATE_SUB(DATE(CONVERT_TZ(NOW(), '+00:00', '+05:30')), INTERVAL 6 DAY)");
    } else if (dateRange === "month") {
      filterConditions.push("DATE(CONVERT_TZ(cl.created_at, '+00:00', '+05:30')) >= DATE_SUB(DATE(CONVERT_TZ(NOW(), '+00:00', '+05:30')), INTERVAL 29 DAY)");
    } else if (dateRange === "this_month") {
      filterConditions.push("DATE_FORMAT(CONVERT_TZ(cl.created_at, '+00:00', '+05:30'), '%Y-%m') = DATE_FORMAT(CONVERT_TZ(NOW(), '+00:00', '+05:30'), '%Y-%m')");
    } else if (dateRange === "custom" && startDate && endDate) {
      filterConditions.push("DATE(CONVERT_TZ(cl.created_at, '+00:00', '+05:30')) BETWEEN ? AND ?");
      filterParams.push(startDate, endDate);
    }

    const filteredWhere = filterConditions.length > 0 ? `WHERE ${filterConditions.join(" AND ")}` : "";
    const roleScopedWhere = roleConditions.length > 0 ? `WHERE ${roleConditions.join(" AND ")}` : "";

    // ── 4. Queries ──────────────────────────────────────────────────────────

    // A. Detailed Call Logs
    const [logs] = await db.query(
      `SELECT 
         cl.*, 
         DATE_FORMAT(CONVERT_TZ(cl.created_at, '+00:00', '+05:30'), '%Y-%m-%d %H:%i:%s') AS call_time_ist,
         l.status AS lead_status, 
         l.college AS lead_college, 
         l.course AS lead_course
       FROM call_logs cl
       LEFT JOIN leads l ON cl.lead_id = l.id
       ${filteredWhere}
       ORDER BY cl.created_at DESC
       LIMIT 1000`,
      filterParams
    );

    // B. Summary for Today (Role-scoped)
    const [todayTotals] = await db.query(
      `SELECT 
         COUNT(*) AS total_today,
         COUNT(DISTINCT NULLIF(TRIM(cl.lead_phone), '')) AS unique_today,
         SUM(CASE WHEN cl.call_type = 'Phone Call' THEN 1 ELSE 0 END) AS phone_today,
         SUM(CASE WHEN cl.call_type = 'Email Follow-up' THEN 1 ELSE 0 END) AS email_today,
         SUM(CASE WHEN ${CONNECTED_SQL} THEN 1 ELSE 0 END) AS connected_today,
         SUM(CASE WHEN ${UNANSWERED_SQL} THEN 1 ELSE 0 END) AS unanswered_today,
         SUM(COALESCE(cl.duration, 0)) AS duration_today
       FROM call_logs cl
       ${roleScopedWhere ? roleScopedWhere + " AND " : "WHERE "}
       DATE(CONVERT_TZ(cl.created_at, '+00:00', '+05:30')) = DATE(CONVERT_TZ(NOW(), '+00:00', '+05:30'))`,
      roleParams
    );

    // C. Summary for This Week (Last 7 Days, Role-scoped)
    const [weekTotals] = await db.query(
      `SELECT 
         COUNT(*) AS total_week,
         COUNT(DISTINCT NULLIF(TRIM(cl.lead_phone), '')) AS unique_week,
         SUM(CASE WHEN ${CONNECTED_SQL} THEN 1 ELSE 0 END) AS connected_week,
         SUM(CASE WHEN ${UNANSWERED_SQL} THEN 1 ELSE 0 END) AS unanswered_week,
         SUM(COALESCE(cl.duration, 0)) AS duration_week
       FROM call_logs cl
       ${roleScopedWhere ? roleScopedWhere + " AND " : "WHERE "}
       DATE(CONVERT_TZ(cl.created_at, '+00:00', '+05:30')) >= DATE_SUB(DATE(CONVERT_TZ(NOW(), '+00:00', '+05:30')), INTERVAL 6 DAY)`,
      roleParams
    );

    // D. Summary for This Month (Last 30 Days, Role-scoped)
    const [monthTotals] = await db.query(
      `SELECT 
         COUNT(*) AS total_month,
         COUNT(DISTINCT NULLIF(TRIM(cl.lead_phone), '')) AS unique_month,
         SUM(CASE WHEN ${CONNECTED_SQL} THEN 1 ELSE 0 END) AS connected_month,
         SUM(CASE WHEN ${UNANSWERED_SQL} THEN 1 ELSE 0 END) AS unanswered_month,
         SUM(COALESCE(cl.duration, 0)) AS duration_month
       FROM call_logs cl
       ${roleScopedWhere ? roleScopedWhere + " AND " : "WHERE "}
       DATE(CONVERT_TZ(cl.created_at, '+00:00', '+05:30')) >= DATE_SUB(DATE(CONVERT_TZ(NOW(), '+00:00', '+05:30')), INTERVAL 29 DAY)`,
      roleParams
    );

    // E. Date-wise Summary (Aggregated by day in IST for trends & tables)
    // Limits to last 30 days if range is 'all' or 'month'
    let dateWiseWhere = roleConditions.length > 0 ? [...roleConditions] : [];
    let dateWiseParams = [...roleParams];
    if (requestedCounsellor && requestedCounsellor !== "ALL") {
      dateWiseWhere.push("(cl.counsellor_name = ? OR cl.counsellor_name LIKE ?)");
      dateWiseParams.push(requestedCounsellor, `%${requestedCounsellor}%`);
    }
    if (dateRange === "week") {
      dateWiseWhere.push("DATE(CONVERT_TZ(cl.created_at, '+00:00', '+05:30')) >= DATE_SUB(DATE(CONVERT_TZ(NOW(), '+00:00', '+05:30')), INTERVAL 6 DAY)");
    } else if (dateRange === "today") {
      dateWiseWhere.push("DATE(CONVERT_TZ(cl.created_at, '+00:00', '+05:30')) = DATE(CONVERT_TZ(NOW(), '+00:00', '+05:30'))");
    } else if (dateRange === "yesterday") {
      dateWiseWhere.push("DATE(CONVERT_TZ(cl.created_at, '+00:00', '+05:30')) = DATE_SUB(DATE(CONVERT_TZ(NOW(), '+00:00', '+05:30')), INTERVAL 1 DAY)");
    } else {
      dateWiseWhere.push("DATE(CONVERT_TZ(cl.created_at, '+00:00', '+05:30')) >= DATE_SUB(DATE(CONVERT_TZ(NOW(), '+00:00', '+05:30')), INTERVAL 29 DAY)");
    }

    const [dateWiseRows] = await db.query(
      `SELECT 
         DATE_FORMAT(CONVERT_TZ(cl.created_at, '+00:00', '+05:30'), '%Y-%m-%d') AS call_date,
         COUNT(*) AS total_calls,
         COUNT(DISTINCT NULLIF(TRIM(cl.lead_phone), '')) AS unique_calls,
         SUM(CASE WHEN cl.call_type = 'Phone Call' THEN 1 ELSE 0 END) AS phone_calls,
         SUM(CASE WHEN cl.call_type = 'Email Follow-up' THEN 1 ELSE 0 END) AS email_calls,
         SUM(CASE WHEN ${CONNECTED_SQL} THEN 1 ELSE 0 END) AS connected_calls,
         SUM(CASE WHEN ${UNANSWERED_SQL} THEN 1 ELSE 0 END) AS unanswered_calls,
         SUM(COALESCE(cl.duration, 0)) AS total_duration
       FROM call_logs cl
       ${dateWiseWhere.length > 0 ? "WHERE " + dateWiseWhere.join(" AND ") : ""}
       GROUP BY call_date
       ORDER BY call_date DESC`,
      dateWiseParams
    );

    // F. Counsellor Breakdown (Daily, Weekly, Monthly performance per real registered counsellor)
    let counsellorStatsRows = [];
    if (assignedCounsellorNames.length > 0) {
      const ph = assignedCounsellorNames.map(() => "?").join(", ");
      const [rows] = await db.query(
        `SELECT 
           u.name AS counsellor_name,
           COUNT(cl.id) AS total_calls,
           COUNT(DISTINCT NULLIF(TRIM(cl.lead_phone), '')) AS unique_calls,
           COUNT(DISTINCT CASE WHEN cl.id IS NOT NULL AND DATE(CONVERT_TZ(cl.created_at, '+00:00', '+05:30')) = DATE(CONVERT_TZ(NOW(), '+00:00', '+05:30')) THEN NULLIF(TRIM(cl.lead_phone), '') END) AS today_unique_calls,
           COUNT(DISTINCT CASE WHEN cl.id IS NOT NULL AND DATE(CONVERT_TZ(cl.created_at, '+00:00', '+05:30')) >= DATE_SUB(DATE(CONVERT_TZ(NOW(), '+00:00', '+05:30')), INTERVAL 6 DAY) THEN NULLIF(TRIM(cl.lead_phone), '') END) AS week_unique_calls,
           COUNT(DISTINCT CASE WHEN cl.id IS NOT NULL AND DATE(CONVERT_TZ(cl.created_at, '+00:00', '+05:30')) >= DATE_SUB(DATE(CONVERT_TZ(NOW(), '+00:00', '+05:30')), INTERVAL 29 DAY) THEN NULLIF(TRIM(cl.lead_phone), '') END) AS month_unique_calls,
           SUM(CASE WHEN cl.id IS NOT NULL AND DATE(CONVERT_TZ(cl.created_at, '+00:00', '+05:30')) = DATE(CONVERT_TZ(NOW(), '+00:00', '+05:30')) THEN 1 ELSE 0 END) AS today_calls,
           SUM(CASE WHEN cl.id IS NOT NULL AND DATE(CONVERT_TZ(cl.created_at, '+00:00', '+05:30')) >= DATE_SUB(DATE(CONVERT_TZ(NOW(), '+00:00', '+05:30')), INTERVAL 6 DAY) THEN 1 ELSE 0 END) AS week_calls,
           SUM(CASE WHEN cl.id IS NOT NULL AND DATE(CONVERT_TZ(cl.created_at, '+00:00', '+05:30')) >= DATE_SUB(DATE(CONVERT_TZ(NOW(), '+00:00', '+05:30')), INTERVAL 29 DAY) THEN 1 ELSE 0 END) AS month_calls,
           SUM(CASE WHEN cl.id IS NOT NULL AND ${CONNECTED_SQL} THEN 1 ELSE 0 END) AS connected_calls,
           SUM(CASE WHEN cl.id IS NOT NULL AND ${UNANSWERED_SQL} THEN 1 ELSE 0 END) AS unanswered_calls,
           SUM(COALESCE(cl.duration, 0)) AS total_duration,
           MAX(cl.created_at) AS last_call_at
         FROM users u
         LEFT JOIN call_logs cl ON (cl.counsellor_id = u.id OR cl.counsellor_name = u.name)
         WHERE u.role = 'Counsellor' AND u.is_active = 1 AND u.name IN (${ph})
         GROUP BY u.id, u.name
         ORDER BY today_calls DESC, total_calls DESC`,
        assignedCounsellorNames
      );
      counsellorStatsRows = rows;
    }

    // G. Active Counsellors Today count
    const activeCounsellorsToday = counsellorStatsRows.filter((c) => Number(c.today_calls) > 0).length;

    return NextResponse.json({
      success: true,
      role: userRole,
      currentUser: {
        id: userId,
        name: userName,
        role: userRole,
        unit_id: userUnitId,
      },
      todaySummary: {
        total_today: Number(todayTotals[0]?.total_today) || 0,
        unique_today: Number(todayTotals[0]?.unique_today) || 0,
        phone_today: Number(todayTotals[0]?.phone_today) || 0,
        email_today: Number(todayTotals[0]?.email_today) || 0,
        connected_today: Number(todayTotals[0]?.connected_today) || 0,
        unanswered_today: Number(todayTotals[0]?.unanswered_today) || 0,
        duration_today: Number(todayTotals[0]?.duration_today) || 0,
        active_counsellors: activeCounsellorsToday,
      },
      weekSummary: {
        total_week: Number(weekTotals[0]?.total_week) || 0,
        unique_week: Number(weekTotals[0]?.unique_week) || 0,
        connected_week: Number(weekTotals[0]?.connected_week) || 0,
        unanswered_week: Number(weekTotals[0]?.unanswered_week) || 0,
        duration_week: Number(weekTotals[0]?.duration_week) || 0,
      },
      monthSummary: {
        total_month: Number(monthTotals[0]?.total_month) || 0,
        unique_month: Number(monthTotals[0]?.unique_month) || 0,
        connected_month: Number(monthTotals[0]?.connected_month) || 0,
        unanswered_month: Number(monthTotals[0]?.unanswered_month) || 0,
        duration_month: Number(monthTotals[0]?.duration_month) || 0,
      },
      counsellorDailyStats: counsellorStatsRows.map((c) => ({
        counsellor_name: c.counsellor_name,
        total_calls: Number(c.total_calls) || 0,
        unique_calls: Number(c.unique_calls) || 0,
        today_calls: Number(c.today_calls) || 0,
        today_unique_calls: Number(c.today_unique_calls) || 0,
        week_calls: Number(c.week_calls) || 0,
        week_unique_calls: Number(c.week_unique_calls) || 0,
        month_calls: Number(c.month_calls) || 0,
        month_unique_calls: Number(c.month_unique_calls) || 0,
        connected_calls: Number(c.connected_calls) || 0,
        missed_busy: Number(c.unanswered_calls) || 0,
        total_duration: Number(c.total_duration) || 0,
        last_call_at: c.last_call_at,
      })),
      dateWiseStats: dateWiseRows.map((r) => ({
        call_date: r.call_date,
        total_calls: Number(r.total_calls) || 0,
        unique_calls: Number(r.unique_calls) || 0,
        phone_calls: Number(r.phone_calls) || 0,
        email_calls: Number(r.email_calls) || 0,
        connected_calls: Number(r.connected_calls) || 0,
        unanswered_calls: Number(r.unanswered_calls) || 0,
        total_duration: Number(r.total_duration) || 0,
      })),
      logs,
      counsellors: assignedCounsellorNames,
      unitHeads: availableUnitHeads,
    });
  } catch (error) {
    console.error("GET /api/admin/reports error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
