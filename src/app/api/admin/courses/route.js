import { NextResponse } from "next/server";
import { getDbPool, initDatabase } from "@/lib/db";

export async function GET() {
  try {
    await initDatabase();
    const db = getDbPool();
    const [rows] = await db.query(
      `SELECT c.*, col.name AS college_name 
       FROM courses c 
       LEFT JOIN colleges col ON c.college_id = col.id 
       ORDER BY c.name ASC`
    );
    return NextResponse.json({ success: true, courses: rows });
  } catch (error) {
    console.error("GET /api/admin/courses error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await initDatabase();
    const db = getDbPool();
    const body = await request.json();
    const { name, college_id, duration } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: "Course name is required" }, { status: 400 });
    }

    const [result] = await db.query(
      "INSERT INTO courses (name, college_id, duration) VALUES (?, ?, ?)",
      [name, college_id || null, duration || null]
    );
    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error("POST /api/admin/courses error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await initDatabase();
    const db = getDbPool();
    const body = await request.json();
    const { id, name, college_id, duration, is_active } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "id is required" }, { status: 400 });
    }

    const updates = [];
    const values = [];

    if (name !== undefined) { updates.push("name = ?"); values.push(name); }
    if (college_id !== undefined) { updates.push("college_id = ?"); values.push(college_id || null); }
    if (duration !== undefined) { updates.push("duration = ?"); values.push(duration); }
    if (is_active !== undefined) { updates.push("is_active = ?"); values.push(is_active); }

    if (updates.length === 0) {
      return NextResponse.json({ success: false, error: "No fields to update" }, { status: 400 });
    }

    values.push(id);
    await db.query(`UPDATE courses SET ${updates.join(", ")} WHERE id = ?`, values);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/admin/courses error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await initDatabase();
    const db = getDbPool();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "id parameter required" }, { status: 400 });
    }

    await db.query("DELETE FROM courses WHERE id = ?", [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/courses error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
