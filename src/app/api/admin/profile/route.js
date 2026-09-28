import { NextResponse } from "next/server";
import { getDbPool, initDatabase } from "@/lib/db";

export async function GET() {
  try {
    await initDatabase();
    const db = getDbPool();
    // Assuming there's only one admin for now, or just fetching the first one.
    const [rows] = await db.query(
      "SELECT id, name, email, employee_id, role, avatar FROM users WHERE role = 'Admin' LIMIT 1"
    );
    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: "Admin not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, admin: rows[0] });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await initDatabase();
    const db = getDbPool();
    const body = await request.json();
    const { id, name, email, password } = body;

    if (!id || !name || !email) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const updates = ["name = ?", "email = ?"];
    const values = [name, email];

    if (password) {
      updates.push("password = ?");
      values.push(password);
    }
    
    values.push(id);

    await db.query(`UPDATE users SET ${updates.join(", ")} WHERE id = ? AND role = 'Admin'`, values);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
