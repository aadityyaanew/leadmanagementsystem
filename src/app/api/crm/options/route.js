import { NextResponse } from "next/server";
import { getDbPool, initDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await initDatabase();
    const db = getDbPool();

    // Fetch active colleges, courses, units, and counsellors
    const [colleges] = await db.query(
      "SELECT id, name FROM colleges WHERE is_active = 1 ORDER BY name ASC"
    );
    const [courses] = await db.query(
      "SELECT id, name, college_id FROM courses WHERE is_active = 1 ORDER BY name ASC"
    );
    const [units] = await db.query(
      "SELECT id, name, round_robin_enabled FROM units WHERE is_active = 1 ORDER BY name ASC"
    );
    const [counsellors] = await db.query(
      "SELECT id, name, unit_id FROM users WHERE role = 'Counsellor' AND is_active = 1 ORDER BY name ASC"
    );

    return NextResponse.json({
      success: true,
      colleges: colleges.map((c) => c.name),
      courses: courses.map((c) => c.name),
      rawCourses: courses, // { id, name, college_id } for college-specific filtering if needed
      rawColleges: colleges,
      units: units.map((u) => u.name),
      rawUnits: units,
      counsellors: counsellors.map((c) => c.name),
    });
  } catch (error) {
    console.error("GET /api/crm/options error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
