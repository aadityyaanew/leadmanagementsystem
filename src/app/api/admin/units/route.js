import { NextResponse } from "next/server";
import { getDbPool, initDatabase } from "@/lib/db";

export async function GET() {
  try {
    await initDatabase();
    const db = getDbPool();
    const [rows] = await db.query(
      `SELECT u.*, usr.name AS head_name,
        (SELECT COUNT(*) FROM users c WHERE c.unit_id = u.id AND c.role = 'Counsellor' AND c.is_active = 1) AS eligible_counsellors_count
       FROM units u 
       LEFT JOIN users usr ON u.head_user_id = usr.id 
       ORDER BY u.name ASC`
    );
    return NextResponse.json({ success: true, units: rows });
  } catch (error) {
    console.error("GET /api/admin/units error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await initDatabase();
    const db = getDbPool();
    const body = await request.json();
    const { name, location, head_user_id, round_robin_enabled = 1 } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: "Unit name is required" }, { status: 400 });
    }

    const rrVal = round_robin_enabled === 0 || round_robin_enabled === false ? 0 : 1;

    const [result] = await db.query(
      "INSERT INTO units (name, location, head_user_id, round_robin_enabled) VALUES (?, ?, ?, ?)",
      [name, location || null, head_user_id || null, rrVal]
    );
    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error("POST /api/admin/units error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await initDatabase();
    const db = getDbPool();
    const body = await request.json();
    const { id, name, location, head_user_id, is_active, round_robin_enabled } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "id is required" }, { status: 400 });
    }

    const updates = [];
    const values = [];

    if (name !== undefined) { updates.push("name = ?"); values.push(name); }
    if (location !== undefined) { updates.push("location = ?"); values.push(location); }
    if (head_user_id !== undefined) { updates.push("head_user_id = ?"); values.push(head_user_id || null); }
    if (is_active !== undefined) { updates.push("is_active = ?"); values.push(is_active); }
    if (round_robin_enabled !== undefined) {
      const rrVal = round_robin_enabled === 0 || round_robin_enabled === false ? 0 : 1;
      updates.push("round_robin_enabled = ?");
      values.push(rrVal);
    }

    if (updates.length === 0) {
      return NextResponse.json({ success: false, error: "No fields to update" }, { status: 400 });
    }

    values.push(id);
    await db.query(`UPDATE units SET ${updates.join(", ")} WHERE id = ?`, values);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/admin/units error:", error);
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

    await db.query("DELETE FROM units WHERE id = ?", [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/units error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
