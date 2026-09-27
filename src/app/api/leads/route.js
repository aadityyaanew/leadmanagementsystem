import { NextResponse } from "next/server";
import { getDbPool, initDatabase } from "@/lib/db";
import { INITIAL_LEADS } from "@/data/initialLeads";

export async function GET() {
  try {
    await initDatabase();
    const db = getDbPool();

    const [rows] = await db.query("SELECT * FROM leads ORDER BY punchDate DESC");

    // If database is completely empty on first connection, seed with initial mock leads
    if (rows.length === 0 && INITIAL_LEADS.length > 0) {
      for (const lead of INITIAL_LEADS) {
        await db.query(
          `INSERT INTO leads (
            id, name, email, mobile, college, course, center, counsellor,
            status, leadType, source, duplicateOfId, duplicateCount,
            punchDate, notes, followUps, timeline
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            lead.id,
            lead.name,
            lead.email || null,
            lead.mobile || null,
            lead.college || null,
            lead.course || null,
            lead.center || null,
            lead.counsellor || null,
            lead.status || "New Lead",
            lead.leadType || "Primary",
            lead.source || null,
            lead.duplicateOfId || null,
            lead.duplicateCount || 0,
            lead.punchDate ? new Date(lead.punchDate) : new Date(),
            JSON.stringify(lead.notes || []),
            JSON.stringify(lead.followUps || []),
            JSON.stringify(lead.timeline || []),
          ]
        );
      }

      const [seededRows] = await db.query("SELECT * FROM leads ORDER BY punchDate DESC");
      const normalized = seededRows.map(formatLeadRow);
      return NextResponse.json({ success: true, leads: normalized });
    }

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

export async function POST(request) {
  try {
    await initDatabase();
    const db = getDbPool();
    const body = await request.json();

    const { action } = body;

    // Reset to sample data
    if (action === "reset") {
      await db.query("DELETE FROM leads");
      for (const lead of INITIAL_LEADS) {
        await db.query(
          `INSERT INTO leads (
            id, name, email, mobile, college, course, center, counsellor,
            status, leadType, source, duplicateOfId, duplicateCount,
            punchDate, notes, followUps, timeline
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            lead.id,
            lead.name,
            lead.email || null,
            lead.mobile || null,
            lead.college || null,
            lead.course || null,
            lead.center || null,
            lead.counsellor || null,
            lead.status || "New Lead",
            lead.leadType || "Primary",
            lead.source || null,
            lead.duplicateOfId || null,
            lead.duplicateCount || 0,
            lead.punchDate ? new Date(lead.punchDate) : new Date(),
            JSON.stringify(lead.notes || []),
            JSON.stringify(lead.followUps || []),
            JSON.stringify(lead.timeline || []),
          ]
        );
      }
      return NextResponse.json({ success: true, message: "Reset to sample data" });
    }

    // Single create lead
    const lead = body.lead;
    if (!lead || !lead.name) {
      return NextResponse.json({ success: false, error: "Lead name is required" }, { status: 400 });
    }

    await db.query(
      `INSERT INTO leads (
        id, name, email, mobile, college, course, center, counsellor,
        status, leadType, source, duplicateOfId, duplicateCount,
        punchDate, notes, followUps, timeline
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        email = VALUES(email),
        mobile = VALUES(mobile),
        college = VALUES(college),
        course = VALUES(course),
        center = VALUES(center),
        counsellor = VALUES(counsellor),
        status = VALUES(status),
        leadType = VALUES(leadType),
        source = VALUES(source),
        duplicateOfId = VALUES(duplicateOfId),
        duplicateCount = VALUES(duplicateCount),
        notes = VALUES(notes),
        followUps = VALUES(followUps),
        timeline = VALUES(timeline)`,
      [
        lead.id,
        lead.name,
        lead.email || null,
        lead.mobile || null,
        lead.college || null,
        lead.course || null,
        lead.center || null,
        lead.counsellor || null,
        lead.status || "New Lead",
        lead.leadType || "Primary",
        lead.source || null,
        lead.duplicateOfId || null,
        lead.duplicateCount || 0,
        lead.punchDate ? new Date(lead.punchDate) : new Date(),
        JSON.stringify(lead.notes || []),
        JSON.stringify(lead.followUps || []),
        JSON.stringify(lead.timeline || []),
      ]
    );

    // If duplicate was linked to a primary lead, update primary lead duplicate count
    if (body.updatePrimaryId) {
      await db.query(
        `UPDATE leads 
         SET duplicateCount = duplicateCount + 1,
             timeline = JSON_ARRAY_APPEND(
               COALESCE(timeline, '[]'),
               '$',
               CAST(? AS JSON)
             )
         WHERE id = ?`,
        [
          JSON.stringify({
            date: new Date().toISOString(),
            event: "Duplicate Inquiry Linked",
            detail: `Duplicate lead #${lead.id} received via ${lead.source || "inquiry"}`,
          }),
          body.updatePrimaryId,
        ]
      );
    }

    return NextResponse.json({ success: true, lead });
  } catch (error) {
    console.error("POST /api/leads error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    await initDatabase();
    const db = getDbPool();
    const body = await request.json();

    // Bulk update status
    if (body.action === "bulkUpdateStatus") {
      const { leadIds, status } = body;
      if (!Array.isArray(leadIds) || leadIds.length === 0) {
        return NextResponse.json({ success: false, error: "leadIds must be a non-empty array" }, { status: 400 });
      }

      await db.query(
        `UPDATE leads SET status = ? WHERE id IN (?)`,
        [status, leadIds]
      );
      return NextResponse.json({ success: true });
    }

    // Bulk assign counsellor
    if (body.action === "bulkAssignCounsellor") {
      const { leadIds, counsellor } = body;
      if (!Array.isArray(leadIds) || leadIds.length === 0) {
        return NextResponse.json({ success: false, error: "leadIds must be a non-empty array" }, { status: 400 });
      }

      await db.query(
        `UPDATE leads SET counsellor = ? WHERE id IN (?)`,
        [counsellor, leadIds]
      );
      return NextResponse.json({ success: true });
    }

    // Update single lead
    const { id, updatedFields } = body;
    if (!id || !updatedFields) {
      return NextResponse.json({ success: false, error: "id and updatedFields are required" }, { status: 400 });
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/leads error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    await initDatabase();
    const db = getDbPool();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const bulkIds = searchParams.get("ids");

    if (bulkIds) {
      const idsArray = bulkIds.split(",");
      await db.query("DELETE FROM leads WHERE id IN (?)", [idsArray]);
      return NextResponse.json({ success: true });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: "id parameter required" }, { status: 400 });
    }

    await db.query("DELETE FROM leads WHERE id = ?", [id]);
    return NextResponse.json({ success: true });
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
