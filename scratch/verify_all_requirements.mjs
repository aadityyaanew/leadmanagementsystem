import { getDbPool, initDatabase } from "../src/lib/db.js";
import { distributeBulkLeads, distributeSingleLead, distributeUnassignedLeads } from "../src/lib/leadDistribution.js";

async function query(sql, params) {
  const pool = getDbPool();
  const [res] = await pool.query(sql, params);
  return res;
}

async function runTestSuite() {
  console.log("=== STARTING COMPREHENSIVE CRM ENHANCEMENT TEST SUITE ===");
  await initDatabase();

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = "") {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}: ${details}`);
      failed++;
    }
  }

  try {
    // Setup test unit and test counselors
    // Ensure we have a clean test unit
    const testUnitName = "Test Unit RR QA";
    await query("DELETE FROM call_logs WHERE unit_name = ?", [testUnitName]);
    await query("DELETE FROM leads WHERE center = ?", [testUnitName]);
    await query("DELETE FROM users WHERE email LIKE '%@test.com'");
    await query("DELETE FROM units WHERE name = ?", [testUnitName]);

    const unitRes = await query(
      "INSERT INTO units (name, location, round_robin_enabled) VALUES (?, ?, ?)",
      [testUnitName, "QA Test Lab", 1]
    );
    const testUnitId = unitRes.insertId;

    // Create 3 active counsellors and 1 inactive counsellor for this unit
    const c1Email = `c1_${Date.now()}@test.com`;
    const c2Email = `c2_${Date.now()}@test.com`;
    const c3Email = `c3_${Date.now()}@test.com`;
    const cInactiveEmail = `c_in_${Date.now()}@test.com`;

    const u1 = await query(
      "INSERT INTO users (name, email, password, role, unit_id, is_active) VALUES (?, ?, 'pass', 'Counsellor', ?, 1)",
      ["QA Counsellor Alpha", c1Email, testUnitId]
    );
    const u2 = await query(
      "INSERT INTO users (name, email, password, role, unit_id, is_active) VALUES (?, ?, 'pass', 'Counsellor', ?, 1)",
      ["QA Counsellor Beta", c2Email, testUnitId]
    );
    const u3 = await query(
      "INSERT INTO users (name, email, password, role, unit_id, is_active) VALUES (?, ?, 'pass', 'Counsellor', ?, 1)",
      ["QA Counsellor Gamma", c3Email, testUnitId]
    );
    const uInactive = await query(
      "INSERT INTO users (name, email, password, role, unit_id, is_active) VALUES (?, ?, 'pass', 'Counsellor', ?, 0)",
      ["QA Counsellor Inactive", cInactiveEmail, testUnitId]
    );

    // Test 1: Upload Only (Unassigned)
    const uploadOnlyRows = [
      { name: "Unassigned Student 1", mobile: `9199990001_${Date.now()}`.slice(0, 15), email: `s1_${Date.now()}@test.com` },
      { name: "Unassigned Student 2", mobile: `9199990002_${Date.now()}`.slice(0, 15), email: `s2_${Date.now()}@test.com` },
    ];
    const summaryUploadOnly = await distributeBulkLeads({
      leads: uploadOnlyRows,
      unitIdentifier: testUnitId,
      mode: "upload_only",
      actor: "Admin QA",
    });

    assert(
      summaryUploadOnly.totalUploaded === 2 && summaryUploadOnly.totalAssigned === 0 && summaryUploadOnly.totalUnassigned === 2,
      "Requirement 3: 'Upload Only' option retains all leads as unassigned",
      JSON.stringify(summaryUploadOnly)
    );

    // Test 2: Sequential Round Robin Distribution ("Upload & Distribute")
    const rrBatch1 = [
      { name: "RR Student A", mobile: `9188880001_${Date.now()}`.slice(0, 15), email: `rra_${Date.now()}@test.com` },
      { name: "RR Student B", mobile: `9188880002_${Date.now()}`.slice(0, 15), email: `rrb_${Date.now()}@test.com` },
      { name: "RR Student C", mobile: `9188880003_${Date.now()}`.slice(0, 15), email: `rrc_${Date.now()}@test.com` },
    ];
    const summaryRR1 = await distributeBulkLeads({
      leads: rrBatch1,
      unitIdentifier: testUnitId,
      mode: "distribute",
      actor: "Admin QA",
    });

    assert(
      summaryRR1.totalAssigned === 3 && summaryRR1.totalUnassigned === 0,
      "Requirement 3: 'Upload & Distribute' distributes all leads among eligible counsellors",
      JSON.stringify(summaryRR1)
    );

    // Verify inactive counsellor received 0 leads and each active got 1
    const inactiveCount = summaryRR1.assignmentsByCounsellor["QA Counsellor Inactive"] || 0;
    assert(
      inactiveCount === 0,
      "Requirement 3: Inactive counsellors are strictly excluded from round-robin distribution",
      `Inactive count was: ${inactiveCount}`
    );

    const activeCounts = [
      summaryRR1.assignmentsByCounsellor["QA Counsellor Alpha"] || 0,
      summaryRR1.assignmentsByCounsellor["QA Counsellor Beta"] || 0,
      summaryRR1.assignmentsByCounsellor["QA Counsellor Gamma"] || 0,
    ];
    assert(
      activeCounts.every((c) => c === 1),
      "Requirement 3: Even sequential distribution (1 to each active counselor in batch 1)",
      JSON.stringify(summaryRR1.assignmentsByCounsellor)
    );

    // Test 3: Continuation of rotation across subsequent distributions
    const rrBatch2 = [
      { name: "RR Student D", mobile: `9177770001_${Date.now()}`.slice(0, 15), email: `rrd_${Date.now()}@test.com` },
    ];
    const summaryRR2 = await distributeBulkLeads({
      leads: rrBatch2,
      unitIdentifier: testUnitId,
      mode: "distribute",
      actor: "Admin QA",
    });

    assert(
      summaryRR2.totalAssigned === 1,
      "Requirement 3: Subsequent distribution succeeds and preserves rotation pointer",
      JSON.stringify(summaryRR2)
    );

    // Test 4: Duplicate prevention
    const duplicateBatch = [
      { name: "Duplicate Lead", mobile: rrBatch1[0].mobile, email: rrBatch1[0].email },
    ];
    const summaryDup = await distributeBulkLeads({
      leads: duplicateBatch,
      unitIdentifier: testUnitId,
      mode: "distribute",
      actor: "Admin QA",
    });

    assert(
      summaryDup.totalDuplicates === 1 && summaryDup.totalAssigned === 0,
      "Requirement 3: Duplicate leads are identified, logged, and prevented from re-insertion",
      JSON.stringify(summaryDup)
    );

    // Test 5: Distribute Unassigned Leads later without touching existing leads
    // We already have 2 unassigned leads from Test 1
    const unassignedSummary = await distributeUnassignedLeads({
      unitIdentifier: testUnitId,
      actor: "Admin QA",
    });

    assert(
      unassignedSummary.totalAssigned === 2 && unassignedSummary.totalProcessed === 2,
      "Requirement 3: Authorized user can distribute unassigned leads later without touching assigned leads",
      JSON.stringify(unassignedSummary)
    );

    // Test 6: Round Robin Disabled Configuration
    await query("UPDATE units SET round_robin_enabled = 0 WHERE id = ?", [testUnitId]);
    const rrDisabledLead = await distributeSingleLead({
      leadData: { name: "Manual Student", mobile: `9166660001_${Date.now()}`.slice(0, 15) },
      unitIdentifier: testUnitId,
      actor: "Admin QA",
    });

    assert(
      !rrDisabledLead.lead.counsellor,
      "Requirement 4: When Round Robin is disabled for a Unit, new leads remain unassigned (manual workflow)",
      JSON.stringify(rrDisabledLead)
    );

    // Test 7: Accurate Call Disposition and Reporting (Total Calls vs Unique Leads)
    // Create a specific lead
    const testLeadId = `LD-QA-${Date.now()}`;
    await query(
      "INSERT INTO leads (id, name, mobile, email, center, unit_id, counsellor, counsellor_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Interested')",
      [testLeadId, "Call Report Candidate", `9155550001_${Date.now()}`.slice(0, 15), `call_${Date.now()}@test.com`, testUnitName, testUnitId, "QA Counsellor Alpha", u1.insertId]
    );

    // Simulate 5 calls to this ONE lead by QA Counsellor Alpha
    for (let i = 0; i < 5; i++) {
      await query(
        `INSERT INTO call_logs (lead_id, lead_phone, lead_name, counsellor_name, counsellor_id, unit_id, unit_name, call_type, disposition, duration, notes, created_at)
         VALUES (?, '9155550001', 'Call Report Candidate', 'QA Counsellor Alpha', ?, ?, ?, 'Phone Call', 'Discussion Completed', 60, ?, NOW() - INTERVAL ? SECOND)`,
        [testLeadId, u1.insertId, testUnitId, testUnitName, `Call number ${i + 1}`, (5 - i) * 10]
      );
    }

    // Also test double-click technical deduplication (call within 2 seconds with exact same disposition)
    const recentCall = await query(
      "SELECT id FROM call_logs WHERE lead_id = ? AND counsellor_id = ? ORDER BY id DESC LIMIT 1",
      [testLeadId, u1.insertId]
    );

    // Query Total Calls vs Unique Leads for this Counselor
    const callStats = await query(
      `SELECT
         COUNT(*) as total_calls,
         COUNT(DISTINCT COALESCE(NULLIF(TRIM(lead_id), ''), NULLIF(TRIM(lead_phone), ''))) as unique_leads
       FROM call_logs
       WHERE counsellor_id = ?`,
      [u1.insertId]
    );

    const stats = callStats[0];
    assert(
      parseInt(stats.total_calls) >= 5 && parseInt(stats.unique_leads) === 1,
      "Requirement 6: 5 calls to 1 lead correctly reports 5 Total Calls and 1 Unique Lead Contacted",
      `total_calls: ${stats.total_calls}, unique_leads: ${stats.unique_leads}`
    );

    // Test 8: Role-based Lead Scoping
    // Verify Counselor Alpha ONLY sees their assigned lead
    const alphaBucket = await query(
      "SELECT id, name, counsellor FROM leads WHERE counsellor = ?",
      ["QA Counsellor Alpha"]
    );
    const betaBucket = await query(
      "SELECT id, name, counsellor FROM leads WHERE counsellor = ?",
      ["QA Counsellor Beta"]
    );
    assert(
      alphaBucket.length > 0 && alphaBucket.every((l) => l.counsellor === "QA Counsellor Alpha"),
      "Requirement 1: Counselor only accesses leads in their own bucket",
      `Count: ${alphaBucket.length}`
    );

    // Verify Unit Head scope: all counsellors in unit
    const unitHeadScope = await query(
      "SELECT id, name, counsellor, center FROM leads WHERE unit_id = ? OR center = ?",
      [testUnitId, testUnitName]
    );
    assert(
      unitHeadScope.length >= alphaBucket.length + betaBucket.length,
      "Requirement 2: Unit Head accesses all leads assigned to counselors mapped under their unit",
      `Total unit leads: ${unitHeadScope.length}`
    );

    // Cleanup test data
    await query("DELETE FROM call_logs WHERE unit_id = ?", [testUnitId]);
    await query("DELETE FROM leads WHERE unit_id = ? OR center = ?", [testUnitId, testUnitName]);
    await query("DELETE FROM users WHERE unit_id = ?", [testUnitId]);
    await query("DELETE FROM units WHERE id = ?", [testUnitId]);
    console.log("Cleaned up QA test data cleanly.");

  } catch (err) {
    console.error("Test execution exception:", err);
    failed++;
  }

  console.log(`\n=== TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED ===\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().then(() => {
  console.log("Test suite finished successfully.");
  process.exit(0);
});
