/**
 
 * Centralized Lead Distribution Service for LMS.
 *
 * Requirements addressed:
 * 1. Unit-level round robin lead distribution continuing across subsequent distributions.
 * 2. Excludes inactive counsellors (is_active = 1 only).
 * 3. Retains leads as unassigned if no eligible counsellors are available or if Round Robin is disabled.
 * 4. Supports "Upload Only" (unassigned) and "Upload & Distribute" modes.
 * 5. Prevents duplicate assignments and tracks duplicate lead links.
 * 6. Preserves assignment history in timeline.
 * 7. Allows distributing unassigned leads later without touching already-assigned leads.
 * 8. Compatible with future API integrations and webhooks.
 */

import { getDbPool } from "./db.js";

/**
 * Normalizes a phone number to last 10 digits for matching.
 */
export function normalizePhone(phone = "") {
  return String(phone || "").replace(/[^0-9]/g, "").slice(-10);
}

/**
 * Normalizes email for case-insensitive matching.
 */
export function normalizeEmail(email = "") {
  return String(email || "").trim().toLowerCase();
}

/**
 * Resolves unit information by ID or Name.
 * @param {object} db - MySQL connection/pool
 * @param {number|string} unitIdentifier - unit ID or unit Name
 * @returns {Promise<object|null>}
 */
export async function getUnitByIdOrName(db, unitIdentifier) {
  if (!unitIdentifier) return null;
  const isNumeric = !isNaN(Number(unitIdentifier)) && String(unitIdentifier).trim() !== "";

  if (isNumeric) {
    const [rows] = await db.query(
      "SELECT * FROM units WHERE id = ? LIMIT 1",
      [Number(unitIdentifier)]
    );
    if (rows.length > 0) return rows[0];
  }

  const [rows] = await db.query(
    "SELECT * FROM units WHERE LOWER(name) = LOWER(?) LIMIT 1",
    [String(unitIdentifier).trim()]
  );
  return rows[0] || null;
}

/**
 * Fetches eligible active counsellors for a given unit.
 * Excludes inactive counsellors.
 * @param {object} db - MySQL connection/pool
 * @param {number} unitId - Unit ID
 * @returns {Promise<Array<{id: number, name: string, employee_id: string}>>}
 */
export async function getEligibleCounsellorsForUnit(db, unitId) {
  if (!unitId) return [];
  const [rows] = await db.query(
    `SELECT id, name, employee_id, email, phone 
     FROM users 
     WHERE unit_id = ? AND role = 'Counsellor' AND is_active = 1 
     ORDER BY id ASC`,
    [unitId]
  );
  return rows;
}

/**
 * Checks if a lead with matching mobile or email already exists.
 * @param {object} db - MySQL connection/pool
 * @param {string} mobile - Phone number
 * @param {string} email - Email address
 * @param {string|null} excludeLeadId - Lead ID to exclude (for updates)
 * @returns {Promise<{isDuplicate: boolean, matchedLead: object|null, matchType: string|null}>}
 */
export async function checkLeadDuplicate(db, mobile, email, excludeLeadId = null) {
  const normMobile = normalizePhone(mobile);
  const normEmail = normalizeEmail(email);

  if (!normMobile && !normEmail) {
    return { isDuplicate: false, matchedLead: null, matchType: null };
  }

  // Fetch candidate leads matching mobile suffix or email
  const conditions = [];
  const params = [];

  if (normMobile) {
    conditions.push("REPLACE(REPLACE(REPLACE(mobile, ' ', ''), '-', ''), '+', '') LIKE ?");
    params.push(`%${normMobile}%`);
  }
  if (normEmail) {
    conditions.push("LOWER(TRIM(email)) = ?");
    params.push(normEmail);
  }

  let whereSql = `(${conditions.join(" OR ")})`;
  if (excludeLeadId) {
    whereSql += " AND id != ?";
    params.push(excludeLeadId);
  }

  const [rows] = await db.query(
    `SELECT id, name, mobile, email, counsellor, center, status, leadType, duplicateCount 
     FROM leads WHERE ${whereSql} LIMIT 5`,
    params
  );

  for (const row of rows) {
    const rowMobile = normalizePhone(row.mobile);
    const rowEmail = normalizeEmail(row.email);

    const matchMobile = normMobile && rowMobile && normMobile === rowMobile;
    const matchEmail = normEmail && rowEmail && normEmail === rowEmail;

    if (matchMobile || matchEmail) {
      let matchType = "mobile";
      if (matchMobile && matchEmail) matchType = "both";
      else if (matchEmail) matchType = "email";

      return {
        isDuplicate: true,
        matchedLead: row,
        matchType,
      };
    }
  }

  return { isDuplicate: false, matchedLead: null, matchType: null };
}

/**
 * Distributes a single lead based on target unit configuration.
 * Future integration compatible (webhooks, APIs, single forms).
 *
 * @param {object} params
 * @param {object} params.db - Database pool
 * @param {object} params.leadData - The incoming lead payload
 * @param {number|string} params.unitIdentifier - Unit ID or Name
 * @param {string} [params.actor] - User who triggered the action
 * @param {string|null} [params.manualCounsellor] - Optional explicit counsellor override
 * @returns {Promise<object>}
 */
export async function distributeSingleLead({
  db = getDbPool(),
  leadData,
  unitIdentifier,
  actor = "System",
  manualCounsellor = null,
}) {
  const unit = await getUnitByIdOrName(db, unitIdentifier);
  const now = new Date().toISOString();
  const punchDate = leadData.punchDate ? new Date(leadData.punchDate) : new Date();
  const leadId = leadData.id || `LD-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  // Duplicate Check
  const dupCheck = await checkLeadDuplicate(db, leadData.mobile, leadData.email, leadData.id);

  if (dupCheck.isDuplicate && dupCheck.matchedLead) {
    const primaryLead = dupCheck.matchedLead;
    const duplicateLead = {
      ...leadData,
      id: leadId,
      center: unit ? unit.name : leadData.center || null,
      unit_id: unit ? unit.id : null,
      counsellor: primaryLead.counsellor || null, // Linked to primary counsellor
      leadType: "Duplicate",
      duplicateOfId: primaryLead.id,
      duplicateCount: 0,
      punchDate,
      notes: leadData.notes || [],
      followUps: leadData.followUps || [],
      timeline: [
        {
          date: now,
          event: "Duplicate Lead Recorded",
          detail: `Duplicate inquiry linked to Primary Lead #${primaryLead.id} (matched via ${dupCheck.matchType}). Recorded by ${actor}.`,
        },
      ],
    };

    // Save duplicate lead
    await db.query(
      `INSERT INTO leads (
        id, name, email, mobile, college, course, center, counsellor,
        status, leadType, source, duplicateOfId, duplicateCount,
        punchDate, notes, followUps, timeline, unit_id, counsellor_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        duplicateLead.id,
        duplicateLead.name,
        duplicateLead.email || null,
        duplicateLead.mobile || null,
        duplicateLead.college || null,
        duplicateLead.course || null,
        duplicateLead.center || null,
        duplicateLead.counsellor || null,
        duplicateLead.status || "New Lead",
        "Duplicate",
        duplicateLead.source || null,
        primaryLead.id,
        0,
        punchDate,
        JSON.stringify(duplicateLead.notes || []),
        JSON.stringify(duplicateLead.followUps || []),
        JSON.stringify(duplicateLead.timeline || []),
        duplicateLead.unit_id || null,
        null,
      ]
    );

    // Update primary lead duplicate count and timeline
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
          date: now,
          event: "Duplicate Inquiry Linked",
          detail: `Duplicate inquiry #${duplicateLead.id} received via ${duplicateLead.source || "inquiry"}`,
        }),
        primaryLead.id,
      ]
    );

    return {
      success: true,
      isDuplicate: true,
      lead: duplicateLead,
      primaryLeadId: primaryLead.id,
      assignedCounsellor: duplicateLead.counsellor,
    };
  }

  // Primary lead: Determine assignment
  let assignedCounsellor = manualCounsellor || null;
  let assignedCounsellorId = null;
  let assignmentEvent = null;

  if (!assignedCounsellor && unit && Boolean(unit.round_robin_enabled)) {
    const counsellors = await getEligibleCounsellorsForUnit(db, unit.id);
    if (counsellors.length > 0) {
      // Find rotation index starting after unit.last_assigned_counsellor_id
      let nextIndex = 0;
      if (unit.last_assigned_counsellor_id) {
        const lastIdx = counsellors.findIndex((c) => c.id === unit.last_assigned_counsellor_id);
        if (lastIdx !== -1) {
          nextIndex = (lastIdx + 1) % counsellors.length;
        }
      }

      const picked = counsellors[nextIndex];
      assignedCounsellor = picked.name;
      assignedCounsellorId = picked.id;

      // Update unit last assigned counsellor
      await db.query(
        "UPDATE units SET last_assigned_counsellor_id = ? WHERE id = ?",
        [picked.id, unit.id]
      );

      assignmentEvent = {
        date: now,
        event: "Lead Assigned via Round Robin",
        detail: `Sequentially assigned to ${assignedCounsellor} (${unit.name}) by ${actor}`,
      };
    }
  }

  const initialTimeline = [
    {
      date: now,
      event: "Lead Punched",
      detail: `Punched via ${leadData.source || "Direct Entry"} by ${actor}`,
    },
  ];

  if (assignmentEvent) {
    initialTimeline.push(assignmentEvent);
  } else if (assignedCounsellor) {
    initialTimeline.push({
      date: now,
      event: "Counsellor Assigned",
      detail: `Assigned to ${assignedCounsellor} by ${actor}`,
    });
  }

  const newLead = {
    ...leadData,
    id: leadId,
    center: unit ? unit.name : leadData.center || null,
    unit_id: unit ? unit.id : null,
    counsellor: assignedCounsellor,
    counsellor_id: assignedCounsellorId,
    leadType: "Primary",
    duplicateOfId: null,
    duplicateCount: 0,
    punchDate,
    notes: leadData.notes || [],
    followUps: leadData.followUps || [],
    timeline: initialTimeline,
  };

  await db.query(
    `INSERT INTO leads (
      id, name, email, mobile, college, course, center, counsellor,
      status, leadType, source, duplicateOfId, duplicateCount,
      punchDate, notes, followUps, timeline, unit_id, counsellor_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      newLead.id,
      newLead.name,
      newLead.email || null,
      newLead.mobile || null,
      newLead.college || null,
      newLead.course || null,
      newLead.center || null,
      newLead.counsellor || null,
      newLead.status || "New Lead",
      "Primary",
      newLead.source || null,
      null,
      0,
      punchDate,
      JSON.stringify(newLead.notes || []),
      JSON.stringify(newLead.followUps || []),
      JSON.stringify(newLead.timeline || []),
      newLead.unit_id || null,
      newLead.counsellor_id || null,
    ]
  );

  return {
    success: true,
    isDuplicate: false,
    lead: newLead,
    assignedCounsellor,
  };
}

/**
 * Centralized Bulk Upload & Distribution Handler.
 * Supports:
 * - "distribute": Distribute sequentially via Round Robin among eligible unit counsellors.
 * - "upload_only": Store leads as unassigned for this unit.
 *
 * @param {object} params
 * @param {object} params.db - Database pool
 * @param {Array<object>} params.leads - Array of parsed lead objects {name, mobile, email, college, course, ...}
 * @param {number|string} params.unitIdentifier - Unit ID or Name
 * @param {"distribute"|"upload_only"} [params.mode="distribute"] - Distribution mode
 * @param {string} [params.actor="System"] - User who initiated the upload
 * @returns {Promise<object>} Summary of the distribution operation
 */
export async function distributeBulkLeads({
  db = getDbPool(),
  leads = [],
  unitIdentifier,
  mode = "distribute",
  actor = "System",
}) {
  const unit = await getUnitByIdOrName(db, unitIdentifier);
  if (!unit) {
    throw new Error(`Target Unit "${unitIdentifier}" not found.`);
  }

  const isDistribute = mode === "distribute";
  const rrEnabled = Boolean(unit.round_robin_enabled);

  // Fetch active eligible counsellors
  let eligibleCounsellors = [];
  if (isDistribute && rrEnabled) {
    eligibleCounsellors = await getEligibleCounsellorsForUnit(db, unit.id);
  }

  // Determine starting rotation index
  let currentRotationIndex = 0;
  if (eligibleCounsellors.length > 0 && unit.last_assigned_counsellor_id) {
    const lastIdx = eligibleCounsellors.findIndex(
      (c) => c.id === unit.last_assigned_counsellor_id
    );
    if (lastIdx !== -1) {
      currentRotationIndex = (lastIdx + 1) % eligibleCounsellors.length;
    }
  }

  let totalUploaded = leads.length;
  let totalPrimary = 0;
  let totalAssigned = 0;
  let totalUnassigned = 0;
  let totalDuplicates = 0;
  const assignmentsByCounsellor = {};
  const processedLeads = [];
  let lastAssignedId = unit.last_assigned_counsellor_id;

  const now = new Date().toISOString();

  for (let i = 0; i < leads.length; i++) {
    const row = leads[i];
    const punchDate = row.punchDate ? new Date(row.punchDate) : new Date();
    const leadId = row.id || `LD-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    // 1. Check duplicate
    const dupCheck = await checkLeadDuplicate(db, row.mobile, row.email);

    if (dupCheck.isDuplicate && dupCheck.matchedLead) {
      totalDuplicates++;
      const primaryLead = dupCheck.matchedLead;
      const dupLead = {
        ...row,
        id: leadId,
        center: unit.name,
        unit_id: unit.id,
        counsellor: primaryLead.counsellor || null,
        leadType: "Duplicate",
        duplicateOfId: primaryLead.id,
        duplicateCount: 0,
        punchDate,
        notes: row.notes || [],
        followUps: row.followUps || [],
        timeline: [
          {
            date: now,
            event: "Duplicate Lead Recorded",
            detail: `Bulk upload detected duplicate of Primary Lead #${primaryLead.id} (${dupCheck.matchType}). Recorded by ${actor}.`,
          },
        ],
      };

      await db.query(
        `INSERT INTO leads (
          id, name, email, mobile, college, course, center, counsellor,
          status, leadType, source, duplicateOfId, duplicateCount,
          punchDate, notes, followUps, timeline, unit_id, counsellor_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          dupLead.id,
          dupLead.name,
          dupLead.email || null,
          dupLead.mobile || null,
          dupLead.college || null,
          dupLead.course || null,
          dupLead.center,
          dupLead.counsellor,
          dupLead.status || "New Lead",
          "Duplicate",
          dupLead.source || "CSV Import",
          primaryLead.id,
          0,
          punchDate,
          JSON.stringify(dupLead.notes || []),
          JSON.stringify(dupLead.followUps || []),
          JSON.stringify(dupLead.timeline || []),
          unit.id,
          primaryLead.counsellor_id || null,
        ]
      );

      // Increment duplicate count on primary lead and append timeline
      let primaryTimeline = [];
      try {
        if (primaryLead.timeline) {
          primaryTimeline = typeof primaryLead.timeline === "string"
            ? JSON.parse(primaryLead.timeline)
            : (Array.isArray(primaryLead.timeline) ? primaryLead.timeline : []);
        }
      } catch {
        primaryTimeline = [];
      }
      primaryTimeline.push({
        date: now,
        event: "Duplicate Inquiry Linked",
        detail: `Bulk upload added duplicate lead #${dupLead.id}`,
      });

      await db.query(
        `UPDATE leads 
         SET duplicateCount = duplicateCount + 1,
             timeline = ?
         WHERE id = ?`,
        [JSON.stringify(primaryTimeline), primaryLead.id]
      );

      processedLeads.push(dupLead);
      continue;
    }

    // 2. Primary Lead assignment
    totalPrimary++;
    let assignedCounsellor = null;
    let assignedCounsellorId = null;
    let assignmentTimelineEvent = null;

    if (isDistribute && rrEnabled && eligibleCounsellors.length > 0) {
      const counsellor = eligibleCounsellors[currentRotationIndex];
      assignedCounsellor = counsellor.name;
      assignedCounsellorId = counsellor.id;
      lastAssignedId = counsellor.id;

      // Increment rotation
      currentRotationIndex = (currentRotationIndex + 1) % eligibleCounsellors.length;

      totalAssigned++;
      assignmentsByCounsellor[assignedCounsellor] = (assignmentsByCounsellor[assignedCounsellor] || 0) + 1;

      assignmentTimelineEvent = {
        date: now,
        event: "Lead Assigned via Round Robin",
        detail: `Sequentially assigned to ${assignedCounsellor} (${unit.name}) during bulk upload by ${actor}`,
      };
    } else {
      totalUnassigned++;
      assignmentTimelineEvent = {
        date: now,
        event: "Lead Stored as Unassigned",
        detail: isDistribute && !rrEnabled
          ? `Unit "${unit.name}" has Round Robin disabled; lead saved as unassigned for manual distribution.`
          : isDistribute && eligibleCounsellors.length === 0
            ? `No active eligible counsellors in unit "${unit.name}"; lead saved as unassigned.`
            : `Uploaded as Unassigned in "${unit.name}" by ${actor}.`,
      };
    }

    const timeline = [
      {
        date: now,
        event: "Lead Uploaded",
        detail: `Uploaded via bulk import by ${actor}`,
      },
      assignmentTimelineEvent,
    ];

    const leadRecord = {
      ...row,
      id: leadId,
      center: unit.name,
      unit_id: unit.id,
      counsellor: assignedCounsellor,
      counsellor_id: assignedCounsellorId,
      leadType: "Primary",
      duplicateOfId: null,
      duplicateCount: 0,
      punchDate,
      notes: row.notes || [],
      followUps: row.followUps || [],
      timeline,
    };

    await db.query(
      `INSERT INTO leads (
        id, name, email, mobile, college, course, center, counsellor,
        status, leadType, source, duplicateOfId, duplicateCount,
        punchDate, notes, followUps, timeline, unit_id, counsellor_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        leadRecord.id,
        leadRecord.name,
        leadRecord.email || null,
        leadRecord.mobile || null,
        leadRecord.college || null,
        leadRecord.course || null,
        leadRecord.center,
        leadRecord.counsellor,
        leadRecord.status || "New Lead",
        "Primary",
        leadRecord.source || "CSV Import",
        null,
        0,
        punchDate,
        JSON.stringify(leadRecord.notes || []),
        JSON.stringify(leadRecord.followUps || []),
        JSON.stringify(leadRecord.timeline || []),
        unit.id,
        assignedCounsellorId,
      ]
    );

    processedLeads.push(leadRecord);
  }

  // Update unit's last assigned counsellor if any assignments were made
  if (lastAssignedId !== unit.last_assigned_counsellor_id) {
    await db.query(
      "UPDATE units SET last_assigned_counsellor_id = ? WHERE id = ?",
      [lastAssignedId, unit.id]
    );
  }

  return {
    success: true,
    unit: { id: unit.id, name: unit.name, round_robin_enabled: rrEnabled },
    mode,
    totalUploaded,
    totalPrimary,
    totalAssigned,
    totalUnassigned,
    totalDuplicates,
    assignmentsByCounsellor,
    leads: processedLeads,
  };
}

/**
 * Distributes unassigned leads belonging to a specific unit using Round Robin.
 * Prevents unintentional reassignment of existing assigned leads!
 *
 * @param {object} params
 * @param {object} params.db - Database pool
 * @param {number|string} params.unitIdentifier - Unit ID or Name
 * @param {Array<string>|null} [params.leadIds=null] - Specific lead IDs to distribute
 * @param {string} [params.actor="System"] - User initiating distribution
 * @returns {Promise<object>} Summary of the distribution
 */
export async function distributeUnassignedLeads({
  db = getDbPool(),
  unitIdentifier,
  leadIds = null,
  actor = "System",
}) {
  const unit = await getUnitByIdOrName(db, unitIdentifier);
  if (!unit) {
    throw new Error(`Unit "${unitIdentifier}" not found.`);
  }

  // Check Round Robin configuration
  if (!Boolean(unit.round_robin_enabled)) {
    throw new Error(
      `Round Robin is disabled for unit "${unit.name}". Enable Round Robin in Unit management to distribute leads automatically.`
    );
  }

  const eligibleCounsellors = await getEligibleCounsellorsForUnit(db, unit.id);
  if (eligibleCounsellors.length === 0) {
    throw new Error(`No active counsellors available in unit "${unit.name}" for distribution.`);
  }

  // Strict query: ONLY select leads that are strictly unassigned and belong to this unit!
  let query = `
    SELECT * FROM leads 
    WHERE (counsellor IS NULL OR counsellor = '' OR counsellor = 'Unassigned')
      AND (leadType IS NULL OR leadType != 'Duplicate')
      AND (unit_id = ? OR center = ?)
  `;
  const params = [unit.id, unit.name];

  if (Array.isArray(leadIds) && leadIds.length > 0) {
    const ph = leadIds.map(() => "?").join(", ");
    query += ` AND id IN (${ph})`;
    params.push(...leadIds);
  }

  query += " ORDER BY punchDate ASC";

  const [unassignedLeads] = await db.query(query, params);

  if (unassignedLeads.length === 0) {
    return {
      success: true,
      message: "No unassigned leads found for this unit.",
      totalProcessed: 0,
      totalAssigned: 0,
      assignmentsByCounsellor: {},
    };
  }

  // Determine starting rotation index
  let currentRotationIndex = 0;
  if (unit.last_assigned_counsellor_id) {
    const lastIdx = eligibleCounsellors.findIndex(
      (c) => c.id === unit.last_assigned_counsellor_id
    );
    if (lastIdx !== -1) {
      currentRotationIndex = (lastIdx + 1) % eligibleCounsellors.length;
    }
  }

  const assignmentsByCounsellor = {};
  let lastAssignedId = unit.last_assigned_counsellor_id;
  const now = new Date().toISOString();

  for (const lead of unassignedLeads) {
    const counsellor = eligibleCounsellors[currentRotationIndex];
    lastAssignedId = counsellor.id;

    // Advance rotation
    currentRotationIndex = (currentRotationIndex + 1) % eligibleCounsellors.length;

    assignmentsByCounsellor[counsellor.name] = (assignmentsByCounsellor[counsellor.name] || 0) + 1;

    // Parse existing timeline
    let timeline = [];
    try {
      timeline = typeof lead.timeline === "string" ? JSON.parse(lead.timeline) : (lead.timeline || []);
    } catch {
      timeline = [];
    }

    timeline.unshift({
      date: now,
      event: "Unassigned Lead Distributed",
      detail: `Assigned to ${counsellor.name} via Unit Round Robin by ${actor}`,
    });

    await db.query(
      `UPDATE leads 
       SET counsellor = ?,
           counsellor_id = ?,
           unit_id = ?,
           center = COALESCE(center, ?),
           timeline = ?
       WHERE id = ?`,
      [
        counsellor.name,
        counsellor.id,
        unit.id,
        unit.name,
        JSON.stringify(timeline),
        lead.id,
      ]
    );
  }

  // Persist updated rotation tracker
  if (lastAssignedId !== unit.last_assigned_counsellor_id) {
    await db.query(
      "UPDATE units SET last_assigned_counsellor_id = ? WHERE id = ?",
      [lastAssignedId, unit.id]
    );
  }

  return {
    success: true,
    totalProcessed: unassignedLeads.length,
    totalAssigned: unassignedLeads.length,
    assignmentsByCounsellor,
    unit: { id: unit.id, name: unit.name },
  };
}
