import { NextResponse } from "next/server";
import { getDbPool, initDatabase } from "@/lib/db";

export async function GET() {
  try {
    await initDatabase();
    const db = getDbPool();
    const [rows] = await db.query(
      `SELECT u.*, un.name AS unit_name 
       FROM users u 
       LEFT JOIN units un ON u.unit_id = un.id 
       ORDER BY u.created_at DESC`
    );
    return NextResponse.json({ success: true, users: rows });
  } catch (error) {
    console.error("GET /api/admin/users error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await initDatabase();
    const db = getDbPool();
    const body = await request.json();
    const { name, email, employee_id, password, role, phone, unit_id } = body;

    if (!name || (!email && !employee_id) || !password || !role) {
      return NextResponse.json(
        { success: false, error: "Name, email/employee_id, password and role are required" },
        { status: 400 }
      );
    }

    // Generate avatar from initials
    const parts = name.trim().split(" ");
    const avatar = parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();

    const [result] = await db.query(
      `INSERT INTO users (name, email, employee_id, password, role, phone, unit_id, avatar) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email || null, employee_id || null, password, role, phone || null, unit_id || null, avatar]
    );

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { success: false, error: "A user with this email or employee ID already exists" },
        { status: 409 }
      );
    }
    console.error("POST /api/admin/users error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await initDatabase();
    const db = getDbPool();
    const body = await request.json();
    const { id, name, email, employee_id, password, role, phone, unit_id, is_active } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "id is required" }, { status: 400 });
    }

    const updates = [];
    const values = [];

    if (name !== undefined) {
      const parts = name.trim().split(" ");
      const avatar = parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : name.slice(0, 2).toUpperCase();
      updates.push("name = ?", "avatar = ?");
      values.push(name, avatar);
    }
    if (email !== undefined) { updates.push("email = ?"); values.push(email || null); }
    if (employee_id !== undefined) { updates.push("employee_id = ?"); values.push(employee_id || null); }
    if (password !== undefined && password !== "") { updates.push("password = ?"); values.push(password); }
    if (role !== undefined) { updates.push("role = ?"); values.push(role); }
    if (phone !== undefined) { updates.push("phone = ?"); values.push(phone); }
    if (unit_id !== undefined) { updates.push("unit_id = ?"); values.push(unit_id || null); }
    if (is_active !== undefined) { updates.push("is_active = ?"); values.push(is_active); }

    if (updates.length === 0) {
      return NextResponse.json({ success: false, error: "No fields to update" }, { status: 400 });
    }

    values.push(id);
    await db.query(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, values);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/admin/users error:", error);
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

    await db.query("DELETE FROM users WHERE id = ?", [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/users error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
