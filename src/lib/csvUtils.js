/**
 * csvUtils.js – Pure CSV import / export helpers.
 *
 * Extracted from CRMPage.jsx where they were bloating the component.
 * These are dependency-free functions that can be unit-tested in isolation.
 */

// ─── Export ──────────────────────────────────────────────────────────────────

const EXPORT_HEADERS = [
  "Lead ID", "Name", "Mobile", "Email", "Lead Type", "Status",
  "College", "Course", "Unit", "Counsellor", "Source", "Punching Date",
];

/**
 * Convert an array of lead objects to a downloadable CSV file.
 * @param {object[]} leads
 * @param {string}   filename
 */
export function exportLeadsToCSV(leads, filename) {
  const esc = (v) => {
    if (v == null) return "";
    const s = String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  const rows = [
    EXPORT_HEADERS.join(","),
    ...leads.map((l) =>
      [
        l.id, l.name, l.mobile, l.email, l.leadType, l.status,
        l.college, l.course, l.center, l.counsellor, l.source,
        l.punchDate ? new Date(l.punchDate).toLocaleString("en-IN") : "",
      ].map(esc).join(",")
    ),
  ];

  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename || `Leads_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ─── Import ──────────────────────────────────────────────────────────────────

/**
 * Parse a CSV file and return structured lead data rows.
 * Resolves with { rows: object[], error?: string }.
 *
 * @param {File}   file
 * @returns {Promise<{ rows: object[], error?: string }>}
 */
export function parseLeadsCSV(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split(/\r?\n/).filter((l) => l.trim());

        if (lines.length < 2) {
          resolve({ rows: [], error: "CSV file is empty or missing headers." });
          return;
        }

        const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));

        const findIdx = (...keywords) =>
          headers.findIndex((h) =>
            keywords.some((k) => h.toLowerCase().includes(k))
          );

        const nameIdx   = headers.findIndex((h) => h.toLowerCase().includes("name") && !h.toLowerCase().includes("unit") && !h.toLowerCase().includes("counsellor"));
        const mobileIdx = findIdx("mobile", "phone");
        const emailIdx  = findIdx("email");

        if (nameIdx === -1 || mobileIdx === -1) {
          resolve({ rows: [], error: "CSV must contain Name and Mobile/Phone columns." });
          return;
        }

        const rows = [];
        for (let i = 1; i < lines.length; i++) {
          const row =
            lines[i]
              .match(/(\".*?\"|[^\",\s]+)(?=\s*,|\s*$)/g)
              ?.map((v) => v.replace(/^"|"$/g, "")) ||
            lines[i].split(",");

          if (!row[nameIdx]?.trim() || !row[mobileIdx]?.trim()) continue;

          rows.push({
            name:   row[nameIdx]  || "Unknown",
            mobile: row[mobileIdx] || "Unknown",
            email:  emailIdx !== -1 ? (row[emailIdx] || "") : "",
          });
        }

        resolve({ rows });
      } catch (err) {
        resolve({ rows: [], error: err.message || "Failed to parse CSV." });
      }
    };

    reader.onerror = () => resolve({ rows: [], error: "Failed to read file." });
    reader.readAsText(file);
  });
}

/**
 * Assign counsellors to an array of lead rows using Round Robin.
 * Mutates a copy; returns a new array.
 *
 * @param {object[]} rows
 * @param {string[]} counsellors
 * @returns {object[]}
 */
export function assignRoundRobin(rows, counsellors) {
  if (!counsellors || counsellors.length === 0) return rows;
  return rows.map((row, i) => ({
    ...row,
    counsellor: counsellors[i % counsellors.length],
  }));
}
