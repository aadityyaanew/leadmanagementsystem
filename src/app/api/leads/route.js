import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDbPool, initDatabase } from "@/lib/db";
import { SESSION_COOKIE, parseSessionCookie } from "@/lib/auth";
import {
  distributeSingleLead,
  distributeBulkLeads,
  distributeUnassignedLeads,
} from "@/lib/leadDistribution";

export const dynamic = "force-dynamic";

/**
 * Extracts and parses user session from request cookie or custom header.
 */
async function getSessionFromRequest(request) {
  let sessionCookieValue = request.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionCookieValue) {
    try {
      const cookieStore = await cookies();
      sessionCookieValue = cookieStore.get(SESSION_COOKIE)?.value;
    } catch {}
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
  return session;
}

/**
 * Resolves unit IDs, unit names, and mapped counsellor names for a Unit Head.
 */
async function getUnitHeadScope(db, userId, sessionUnitId) {
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
    counsellorNames = counsellorRows.map((c) => c.name);
  }

  return { unitIds, unitNames, counsellorNames };
}

/**
 * GET /api/leads
 * Returns leads strictly scoped by user role.
 * Counsellor: strictly their own leads.
 * UnitHead: leads assigned to their unit counsellors + unassigned leads in their unit.
 * Admin: all leads.
 */
export async function GET(request) {
  try {
    await initDatabase();
    const db = getDbPool();
    const session = await getSessionFromRequest(request);

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { role, id: userId, unit_id: sessionUnitId, name: userName } = session;

    let whereClause = "";
    let params = [];

    if (role === "Admin") {
      whereClause = "";
    } else if (role === "UnitHead") {
      const { unitIds, unitNames, counsellorNames } = await getUnitHeadScope(db, userId, sessionUnitId);
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
        return NextResponse.json({ success: true, leads: [] });
      }
    } else if (role === "Counsellor") {
      // Counselor lead access: strictly their own bucket only
      whereClause = "WHERE counsellor = ?";
      params = [userName];
    } else {
      return NextResponse.json({ success: false, error: "Forbidden role" }, { status: 403 });
    }

    const [rows] = await db.query(
      `SELECT * FROM leads ${whereClause} ORDER BY punchDate DESC`,
      params
    );

    const formatted = rows.map(formatLeadRow);
    return NextResponse.json({ success: true, leads: formatted });
  } catch (error) {
    console.error("GET /api/leads error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/leads
 * Handles:
 * 1. Single lead creation (via distributeSingleLead with round robin check)
 * 2. Bulk upload & distribution (action: "bulkUpload")
 * 3. Unassigned leads distribution (action: "distributeUnassigned")
 * 4. Sample data reset (action: "reset" - Admin only)
 */
export async function POST(request) {
  try {
    await initDatabase();
    const db = getDbPool();
    const session = await getSessionFromRequest(request);
    const body = await request.json();
    const actor = session?.name || "System";

    // 1. Reset sample data (Admin only)
    if (body.action === "reset") {
      if (session?.role !== "Admin") {
        return NextResponse.json({ success: false, error: "Only Admin can reset data" }, { status: 403 });
      }
      await db.query("DELETE FROM leads");
      return NextResponse.json({ success: true, message: "Leads cleared" });
    }

    // 2. Distribute unassigned leads later (Requirement 3)
    if (body.action === "distributeUnassigned") {
      if (!session || (session.role !== "Admin" && session.role !== "UnitHead")) {
        return NextResponse.json({ success: false, error: "Unauthorized to distribute leads" }, { status: 403 });
      }

      const { unitId, unitName, leadIds } = body;
      const targetUnitIdentifier = unitId || unitName || session.unit_id;

      // If Unit Head, verify target unit belongs to them
      if (session.role === "UnitHead") {
        const { unitIds } = await getUnitHeadScope(db, session.id, session.unit_id);
        const resolvedTarget = await db.query("SELECT id FROM units WHERE id = ? OR name = ?", [targetUnitIdentifier, targetUnitIdentifier]);
        const targetId = resolvedTarget[0]?.[0]?.id;
        if (!unitIds.includes(targetId)) {
          return NextResponse.json({ success: false, error: "Cannot distribute leads for another unit" }, { status: 403 });
        }
      }

      const summary = await distributeUnassignedLeads({
        db,
        unitIdentifier: targetUnitIdentifier,
        leadIds: Array.isArray(leadIds) ? leadIds : null,
        actor,
      });

      return NextResponse.json({ success: true, summary });
    }

    // 3. Bulk Upload & Distribution (Requirement 3 & 5)
    if (body.action === "bulkUpload") {
      if (!session || (session.role !== "Admin" && session.role !== "UnitHead")) {
        return NextResponse.json({ success: false, error: "Unauthorized to upload leads" }, { status: 403 });
      }

      const { leads, unitIdentifier, mode = "distribute" } = body;
      if (!Array.isArray(leads) || leads.length === 0) {
        return NextResponse.json({ success: false, error: "Leads must be a non-empty array" }, { status: 400 });
      }

      const targetUnit = unitIdentifier || (session.role === "UnitHead" ? session.unit_id : null);
      if (!targetUnit) {
        return NextResponse.json({ success: false, error: "Unit must be specified for upload" }, { status: 400 });
      }

      // If Unit Head, verify target unit belongs to them
      if (session.role === "UnitHead") {
        const { unitIds } = await getUnitHeadScope(db, session.id, session.unit_id);
        const [targetRows] = await db.query("SELECT id FROM units WHERE id = ? OR name = ?", [targetUnit, targetUnit]);
        const targetId = targetRows[0]?.id;
        if (!unitIds.includes(targetId)) {
          return NextResponse.json({ success: false, error: "Cannot upload leads to another unit" }, { status: 403 });
        }
      }

      const summary = await distributeBulkLeads({
        db,
        leads,
        unitIdentifier: targetUnit,
        mode,
        actor,
      });

      return NextResponse.json({ success: true, summary });
    }

    // 4. Single lead creation
    const lead = body.lead;
    if (!lead || !lead.name) {
      return NextResponse.json({ success: false, error: "Lead name is required" }, { status: 400 });
    }

    // Determine target unit
    let targetUnit = lead.center || lead.unit_id;
    if (!targetUnit && session?.role === "UnitHead") {
      targetUnit = session.unit_id;
    }

    // If Counsellor is creating lead, force assigned counsellor to themselves
    let manualCounsellor = lead.counsellor;
    if (session?.role === "Counsellor") {
      manualCounsellor = session.name;
    }

    const result = await distributeSingleLead({
      db,
      leadData: lead,
      unitIdentifier: targetUnit,
      actor,
      manualCounsellor,
    });

    return NextResponse.json({
      success: true,
      lead: result.lead,
      isDuplicate: result.isDuplicate,
      primaryLeadId: result.primaryLeadId,
    });
  } catch (error) {
    console.error("POST /api/leads error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/leads
 * Handles lead updates, bulk status updates, bulk counsellor assignment, and call logging.
 * Enforces role permissions and eliminates duplicate technical call events.
 */
export async function PUT(request) {
  try {
    await initDatabase();
    const db = getDbPool();
    const session = await getSessionFromRequest(request);
    const body = await request.json();

    const userRole = session?.role;
    const userName = session?.name;
    const userId = session?.id;

    // A. Bulk update status
    if (body.action === "bulkUpdateStatus") {
      const { leadIds, status } = body;
      if (!Array.isArray(leadIds) || leadIds.length === 0) {
        return NextResponse.json({ success: false, error: "leadIds must be a non-empty array" }, { status: 400 });
      }

      // Permissions check
      if (userRole === "Counsellor") {
        // Counsellors can only update status for their own leads
        const [counsellorLeads] = await db.query(
          `SELECT id FROM leads WHERE id IN (?) AND counsellor = ?`,
          [leadIds, userName]
        );
        if (counsellorLeads.length !== leadIds.length) {
          return NextResponse.json({ success: false, error: "Cannot modify status of leads outside your bucket" }, { status: 403 });
        }
      } else if (userRole === "UnitHead") {
        const { unitIds, counsellorNames } = await getUnitHeadScope(db, userId, session.unit_id);
        const [allowedLeads] = await db.query(
          `SELECT id FROM leads 
           WHERE id IN (?) 
             AND (
               counsellor IN (${counsellorNames.length > 0 ? counsellorNames.map(() => "?").join(",") : "NULL"})
               OR unit_id IN (${unitIds.length > 0 ? unitIds.map(() => "?").join(",") : "NULL"})
             )`,
          [leadIds, ...counsellorNames, ...unitIds]
        );
        if (allowedLeads.length !== leadIds.length) {
          return NextResponse.json({ success: false, error: "Cannot modify status of leads outside your unit" }, { status: 403 });
        }
      }

      await db.query(
        `UPDATE leads SET status = ? WHERE id IN (?)`,
        [status, leadIds]
      );
      return NextResponse.json({ success: true });
    }

    // B. Bulk assign counsellor
    if (body.action === "bulkAssignCounsellor") {
      const { leadIds, counsellor } = body;
      if (!Array.isArray(leadIds) || leadIds.length === 0) {
        return NextResponse.json({ success: false, error: "leadIds must be a non-empty array" }, { status: 400 });
      }

      // Counsellors are NEVER allowed to assign or reassign leads!
      if (userRole === "Counsellor") {
        return NextResponse.json({ success: false, error: "Counselors are not permitted to reassign leads" }, { status: 403 });
      }

      // Unit Head can only assign counsellors mapped under their unit
      if (userRole === "UnitHead") {
        const { counsellorNames } = await getUnitHeadScope(db, userId, session.unit_id);
        if (!counsellorNames.includes(counsellor)) {
          return NextResponse.json({ success: false, error: "Can only assign counsellors mapped under your unit" }, { status: 403 });
        }
      }

      // Lookup counsellor ID and unit ID
      const [uRows] = await db.query(
        "SELECT id, unit_id FROM users WHERE name = ? AND role = 'Counsellor' LIMIT 1",
        [counsellor]
      );
      const counsellorId = uRows[0]?.id || null;
      const unitId = uRows[0]?.unit_id || null;

      await db.query(
        `UPDATE leads 
         SET counsellor = ?, 
             counsellor_id = COALESCE(?, counsellor_id), 
             unit_id = COALESCE(?, unit_id) 
         WHERE id IN (?)`,
        [counsellor, counsellorId, unitId, leadIds]
      );
      return NextResponse.json({ success: true });
    }

    // C. Single Lead Update
    const { id, updatedFields } = body;
    if (!id || !updatedFields) {
      return NextResponse.json({ success: false, error: "id and updatedFields are required" }, { status: 400 });
    }

    // Verify existing lead ownership
    const [existingRows] = await db.query(
      "SELECT id, name, mobile, counsellor, center, unit_id FROM leads WHERE id = ? LIMIT 1",
      [id]
    );
    if (existingRows.length === 0) {
      return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
    }
    const existingLead = existingRows[0];

    // Counsellor restrictions
    if (userRole === "Counsellor") {
      // Must be assigned to this counsellor
      if (existingLead.counsellor !== userName) {
        return NextResponse.json({ success: false, error: "Access denied. Not assigned to your bucket." }, { status: 403 });
      }
      // Counsellor cannot reassign counsellor
      if (updatedFields.counsellor && updatedFields.counsellor !== userName) {
        return NextResponse.json({ success: false, error: "Counselors cannot reassign leads" }, { status: 403 });
      }
    }

    // Unit Head restrictions
    if (userRole === "UnitHead") {
      const { unitIds, counsellorNames } = await getUnitHeadScope(db, userId, session.unit_id);
      const isLeadInUnit =
        counsellorNames.includes(existingLead.counsellor) ||
        unitIds.includes(existingLead.unit_id);
      if (!isLeadInUnit) {
        return NextResponse.json({ success: false, error: "Access denied to other unit leads" }, { status: 403 });
      }
      if (updatedFields.counsellor && !counsellorNames.includes(updatedFields.counsellor)) {
        return NextResponse.json({ success: false, error: "Cannot assign to counsellor outside your unit" }, { status: 403 });
      }
    }

    const updates = [];
    const values = [];

    const jsonFields = ["notes", "followUps", "timeline"];
    for (const [key, val] of Object.entries(updatedFields)) {
      if (jsonFields.includes(key)) {
        updates.push(`\`${key}\` = ?`);
        values.push(JSON.stringify(val));
      } else {
        updates.push(`\`${key}\` = ?`);
        values.push(val);
      }
    }

    if (updates.length > 0) {
      values.push(id);
      await db.query(
        `UPDATE leads SET ${updates.join(", ")} WHERE id = ?`,
        values
      );
    }

    // D. Call Activity Logging (Requirement 6)
    if (body.followUpLog) {
      const { counsellor, mode, outcome, notes, disposition, duration = 0 } = body.followUpLog;
      const counsellorName = counsellor || existingLead.counsellor || userName || "Unassigned";
      const callType = mode || "Phone Call";
      const callDisposition = disposition || outcome || "Call logged";

      // 1. Technical Event Deduplication (Requirement 6):
      // Exclude rapid duplicate technical events (same lead, counsellor, disposition within 5 seconds)
      const [recentDup] = await db.query(
        `SELECT id FROM call_logs 
         WHERE lead_id = ? 
           AND counsellor_name = ? 
           AND call_type = ? 
           AND disposition = ? 
           AND created_at >= DATE_SUB(NOW(), INTERVAL 5 SECOND)
         LIMIT 1`,
        [id, counsellorName, callType, callDisposition]
      );

      if (recentDup.length === 0) {
        // 2. Resolve counsellor and unit linking (Requirement 6)
        let resolvedCounsellorId = null;
        let resolvedUnitId = existingLead.unit_id || null;
        let resolvedUnitName = existingLead.center || null;

        const [cUser] = await db.query(
          "SELECT id, unit_id FROM users WHERE name = ? LIMIT 1",
          [counsellorName]
        );
        if (cUser.length > 0) {
          resolvedCounsellorId = cUser[0].id;
          if (!resolvedUnitId && cUser[0].unit_id) {
            resolvedUnitId = cUser[0].unit_id;
          }
        }

        if (resolvedUnitId && !resolvedUnitName) {
          const [uName] = await db.query("SELECT name FROM units WHERE id = ? LIMIT 1", [resolvedUnitId]);
          if (uName.length > 0) resolvedUnitName = uName[0].name;
        }

        // Insert distinct, preserved call record (never overwriting)
        await db.query(
          `INSERT INTO call_logs (
            lead_id, lead_name, lead_phone, counsellor_name, counsellor_id,
            unit_id, unit_name, call_type, disposition, notes, duration
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            existingLead.name || null,
            existingLead.mobile || null,
            counsellorName,
            resolvedCounsellorId,
            resolvedUnitId,
            resolvedUnitName,
            callType,
            callDisposition,
            notes || outcome || "",
            Number(duration) || 0,
          ]
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/leads error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/leads
 * Enforces role permissions: Counsellors cannot delete leads.
 */
export async function DELETE(request) {
  try {
    await initDatabase();
    const db = getDbPool();
    const session = await getSessionFromRequest(request);

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.role === "Counsellor") {
      return NextResponse.json({ success: false, error: "Counselors are not permitted to delete leads" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const bulkIds = searchParams.get("ids");
    const idsToDelete = bulkIds ? bulkIds.split(",").filter(Boolean) : (id ? [id] : []);

    if (idsToDelete.length === 0) {
      return NextResponse.json({ success: false, error: "id parameter required" }, { status: 400 });
    }

    if (session.role === "UnitHead") {
      const { unitIds, counsellorNames } = await getUnitHeadScope(db, session.id, session.unit_id);
      const [allowedLeads] = await db.query(
        `SELECT id FROM leads 
         WHERE id IN (?) 
           AND (
             counsellor IN (${counsellorNames.length > 0 ? counsellorNames.map(() => "?").join(",") : "NULL"})
             OR unit_id IN (${unitIds.length > 0 ? unitIds.map(() => "?").join(",") : "NULL"})
           )`,
        [idsToDelete, ...counsellorNames, ...unitIds]
      );
      if (allowedLeads.length !== idsToDelete.length) {
        return NextResponse.json({ success: false, error: "Cannot delete leads outside your unit" }, { status: 403 });
      }
    }

    await db.query("DELETE FROM leads WHERE id IN (?)", [idsToDelete]);
    return NextResponse.json({ success: true, count: idsToDelete.length });
  } catch (error) {
    console.error("DELETE /api/leads error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

function formatLeadRow(row) {
  const parseJson = (val) => {
    if (!val) return [];
    if (typeof val === "object") return val;
    try {
      return JSON.parse(val);
    } catch {
      return [];
    }
  };

  return {
    ...row,
    punchDate: row.punchDate ? new Date(row.punchDate).toISOString() : new Date().toISOString(),
    notes: parseJson(row.notes),
    followUps: parseJson(row.followUps),
    timeline: parseJson(row.timeline),
  };
}
