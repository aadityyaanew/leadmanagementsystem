import { NextResponse } from "next/server";
import { getDbPool, initDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    await initDatabase();
    const db = getDbPool();

    const { searchParams } = new URL(request.url);
    const counsellor = searchParams.get("counsellor");
    const dateRange = searchParams.get("dateRange") || "today"; // today, yesterday, week, month, all
    const type = searchParams.get("type"); // Phone Call, WhatsApp Chat, Email Follow-up, all
    const search = searchParams.get("search");

    let whereConditions = [];
    let params = [];

    // Date range filter
    if (dateRange === "today") {
      whereConditions.push("DATE(cl.created_at) = CURDATE()");
    } else if (dateRange === "yesterday") {
      whereConditions.push("DATE(cl.created_at) = SUBDATE(CURDATE(), 1)");
    } else if (dateRange === "week") {
      whereConditions.push("cl.created_at >= SUBDATE(NOW(), INTERVAL 7 DAY)");
    } else if (dateRange === "month") {
      whereConditions.push("cl.created_at >= SUBDATE(NOW(), INTERVAL 30 DAY)");
    }

    if (counsellor && counsellor !== "ALL") {
      whereConditions.push("cl.counsellor_name = ?");
      params.push(counsellor);
    }

    if (type && type !== "ALL") {
      whereConditions.push("cl.call_type = ?");
      params.push(type);
    }

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      whereConditions.push("(cl.lead_name LIKE ? OR cl.lead_phone LIKE ? OR cl.lead_id LIKE ? OR cl.notes LIKE ?)");
      params.push(q, q, q, q);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

    // 1. Fetch detailed call logs
    const [logs] = await db.query(
      `SELECT cl.*, l.status AS lead_status, l.college AS lead_college, l.course AS lead_course
       FROM call_logs cl
       LEFT JOIN leads l ON cl.lead_id = l.id
       ${whereClause}
       ORDER BY cl.created_at DESC
       LIMIT 500`,
      params
    );

    // 2. Aggregate stats (overall & per counsellor for today)
    const [counsellorDailyStats] = await db.query(
      `SELECT 
         counsellor_name,
         COUNT(*) AS total_calls,
         SUM(CASE WHEN call_type = 'Phone Call' THEN 1 ELSE 0 END) AS phone_calls,
         SUM(CASE WHEN call_type = 'WhatsApp Chat' THEN 1 ELSE 0 END) AS whatsapp_chats,
         SUM(CASE WHEN call_type = 'Email Follow-up' THEN 1 ELSE 0 END) AS emails,
         SUM(CASE WHEN disposition LIKE '%Connected%' THEN 1 ELSE 0 END) AS connected_calls,
         SUM(CASE WHEN disposition LIKE '%Ringing%' OR disposition LIKE '%Busy%' THEN 1 ELSE 0 END) AS missed_busy,
         MAX(created_at) AS last_call_at
       FROM call_logs
       WHERE DATE(created_at) = CURDATE()
       GROUP BY counsellor_name
       ORDER BY total_calls DESC`
    );

    // 3. Quick totals for today
    const [todayTotals] = await db.query(
      `SELECT 
         COUNT(*) AS total_today,
         SUM(CASE WHEN call_type = 'Phone Call' THEN 1 ELSE 0 END) AS phone_today,
         SUM(CASE WHEN call_type = 'WhatsApp Chat' THEN 1 ELSE 0 END) AS whatsapp_today,
         SUM(CASE WHEN call_type = 'Email Follow-up' THEN 1 ELSE 0 END) AS email_today
       FROM call_logs
       WHERE DATE(created_at) = CURDATE()`
    );

    // 4. All distinct counsellors with recorded logs
    const [counsellors] = await db.query(
      "SELECT DISTINCT counsellor_name FROM call_logs ORDER BY counsellor_name ASC"
    );

    return NextResponse.json({
      success: true,
      logs,
      counsellorDailyStats,
      todaySummary: todayTotals[0] || {
        total_today: 0,
        phone_today: 0,
        whatsapp_today: 0,
        email_today: 0,
      },
      counsellors: counsellors.map((c) => c.counsellor_name).filter(Boolean),
    });
  } catch (error) {
    console.error("GET /api/admin/reports error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
