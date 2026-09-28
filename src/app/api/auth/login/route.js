import { NextResponse } from "next/server";
import { getDbPool, initDatabase } from "@/lib/db";

export async function POST(request) {
  try {
    await initDatabase();
    const db = getDbPool();
    const body = await request.json();
    const { identifier, password, isAdmin } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, error: "Identifier and password are required" },
        { status: 400 }
      );
    }

    let query = "";
    let params = [];

    if (isAdmin) {
      // Admin logs in with email
      query = "SELECT * FROM users WHERE email = ? AND password = ? AND is_active = 1";
      params = [identifier, password];
    } else {
      // Employees log in with employee_id
      query = "SELECT * FROM users WHERE employee_id = ? AND password = ? AND is_active = 1";
      params = [identifier, password];
    }

    const [rows] = await db.query(query, params);

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials or inactive account" },
        { status: 401 }
      );
    }

    const user = rows[0];

    // Check admin boundaries
    if (isAdmin && user.role !== "Admin") {
      return NextResponse.json(
        { success: false, error: "Access denied. Not an admin." },
        { status: 403 }
      );
    }
    if (!isAdmin && user.role === "Admin") {
      return NextResponse.json(
        { success: false, error: "Admins must use the Admin login page." },
        { status: 403 }
      );
    }

    // Map DB role to USER_ROLES key
    let roleKey = "";
    switch (user.role) {
      case "Admin": roleKey = "ADMIN"; break;
      case "BusinessManager": roleKey = "BUSINESS_MANAGER"; break;
      case "UnitHead": roleKey = "UNIT_HEAD"; break;
      case "Counsellor": roleKey = "COUNSELLOR"; break;
      default: roleKey = "COUNSELLOR";
    }

    return NextResponse.json({ success: true, user, roleKey });
  } catch (error) {
    console.error("POST /api/auth/login error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
