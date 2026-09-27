"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { INITIAL_LEADS } from "@/data/initialLeads";
import { USER_ROLES } from "@/lib/constants";

const ROLE_STORAGE_KEY = "crm_lms_current_role_v1";

function normalizePhone(phone = "") {
  return phone.replace(/[^0-9]/g, "").slice(-10); // get last 10 digits
}

function normalizeEmail(email = "") {
  return email.trim().toLowerCase();
}

export function useLeads() {
  const [leads, setLeads] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentRoleKey, setCurrentRoleKey] = useState("ADMIN");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Fetch leads from MySQL backend API on mount
  const fetchLeadsFromDb = useCallback(async () => {
    try {
      const res = await fetch("/api/leads");
      if (!res.ok) throw new Error("Failed to fetch leads");
      const data = await res.json();
      if (data.success && Array.isArray(data.leads)) {
        setLeads(data.leads);
      }
    } catch (e) {
      console.error("Error fetching leads from MySQL API:", e);
      // Fallback to initial leads if database query fails
      setLeads((prev) => (prev.length > 0 ? prev : INITIAL_LEADS));
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchLeadsFromDb();

    try {
      const savedRole = localStorage.getItem(ROLE_STORAGE_KEY);
      const isAuth = localStorage.getItem("crm_lms_is_auth") === "true";
      if (savedRole && USER_ROLES[savedRole]) {
        setCurrentRoleKey(savedRole);
      }
      setIsAuthenticated(isAuth);
    } catch (e) {
      console.error(e);
    }
  }, [fetchLeadsFromDb]);

  const login = useCallback((roleKey) => {
    if (USER_ROLES[roleKey]) {
      setCurrentRoleKey(roleKey);
      setIsAuthenticated(true);
      try {
        localStorage.setItem(ROLE_STORAGE_KEY, roleKey);
        localStorage.setItem("crm_lms_is_auth", "true");
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    try {
      localStorage.setItem("crm_lms_is_auth", "false");
    } catch (e) {
      console.error(e);
    }
  }, []);

  const switchRole = useCallback((roleKey) => {
    if (USER_ROLES[roleKey]) {
      setCurrentRoleKey(roleKey);
      try {
        localStorage.setItem(ROLE_STORAGE_KEY, roleKey);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const currentRole = USER_ROLES[currentRoleKey] || USER_ROLES.ADMIN;

  // Real-time duplicate detection helper
  const checkDuplicate = useCallback(
    (mobile, email, excludeLeadId = null) => {
      const normMobile = normalizePhone(mobile);
      const normEmail = normalizeEmail(email);

      if (!normMobile && !normEmail) {
        return { isDuplicate: false, matchedLead: null, matchType: null };
      }

      const found = leads.find((l) => {
        if (excludeLeadId && l.id === excludeLeadId) return false;

        const lMobile = normalizePhone(l.mobile);
        const lEmail = normalizeEmail(l.email);

        const matchPhone = normMobile && lMobile && normMobile === lMobile;
        const matchMail = normEmail && lEmail && normEmail === lEmail;

        return matchPhone || matchMail;
      });

      if (!found) {
        return { isDuplicate: false, matchedLead: null, matchType: null };
      }

      const lMobile = normalizePhone(found.mobile);
      const lEmail = normalizeEmail(found.email);
      const matchPhone = normMobile && lMobile && normMobile === lMobile;
      const matchMail = normEmail && lEmail && normEmail === lEmail;

      let matchType = "mobile";
      if (matchPhone && matchMail) matchType = "both";
      else if (matchMail) matchType = "email";

      return {
        isDuplicate: true,
        matchedLead: found,
        matchType,
      };
    },
    [leads]
  );

  // Add a new lead (persists to MySQL)
  const addLead = useCallback(
    async (leadData) => {
      const punchDate = new Date().toISOString();
      const dupCheck = checkDuplicate(leadData.mobile, leadData.email);

      const isDup = dupCheck.isDuplicate;
      const primaryLead = dupCheck.matchedLead;

      const newId = `LD-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      const newLead = {
        ...leadData,
        id: newId,
        leadType: isDup ? "Duplicate" : "Primary",
        duplicateOfId: isDup ? (primaryLead?.duplicateOfId || primaryLead?.id) : null,
        duplicateCount: 0,
        punchDate,
        notes: leadData.notes || [],
        followUps: leadData.followUps || [],
        timeline: [
          {
            date: punchDate,
            event: isDup ? "Duplicate Punched" : "Lead Punched",
            detail: isDup
              ? `Flagged as duplicate of lead #${primaryLead?.id} (${dupCheck.matchType} match)`
              : `Punched via ${leadData.source || "Direct Form"}`,
          },
          ...(leadData.counsellor
            ? [
                {
                  date: punchDate,
                  event: "Counsellor Assigned",
                  detail: `Assigned to ${leadData.counsellor}`,
                },
              ]
            : []),
        ],
      };

      // Optimistic update
      setLeads((prev) => {
        let updated = [newLead, ...prev];
        if (isDup && primaryLead) {
          const targetPrimaryId = primaryLead.duplicateOfId || primaryLead.id;
          updated = updated.map((item) => {
            if (item.id === targetPrimaryId) {
              return {
                ...item,
                duplicateCount: (item.duplicateCount || 0) + 1,
                timeline: [
                  {
                    date: punchDate,
                    event: "Duplicate Inquiry Linked",
                    detail: `Duplicate lead #${newId} received via ${leadData.source || "inquiry"}`,
                  },
                  ...item.timeline,
                ],
              };
            }
            return item;
          });
        }
        return updated;
      });

      // API call to MySQL
      try {
        await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lead: newLead,
            updatePrimaryId: isDup && primaryLead ? (primaryLead.duplicateOfId || primaryLead.id) : null,
          }),
        });
      } catch (err) {
        console.error("Error saving lead to MySQL:", err);
      }

      return { lead: newLead, duplicateInfo: dupCheck };
    },
    [checkDuplicate]
  );

  // Update existing lead (persists to MySQL)
  const updateLead = useCallback(
    async (id, updatedFields) => {
      const now = new Date().toISOString();

      let targetUpdatedLead = null;

      setLeads((prev) => {
        return prev.map((item) => {
          if (item.id !== id) return item;

          const timelineEvents = [...(item.timeline || [])];

          // Check if status changed
          if (updatedFields.status && updatedFields.status !== item.status) {
            timelineEvents.unshift({
              date: now,
              event: "Status Updated",
              detail: `Changed from '${item.status}' to '${updatedFields.status}'`,
            });
          }

          // Check if counsellor changed
          if (updatedFields.counsellor && updatedFields.counsellor !== item.counsellor) {
            timelineEvents.unshift({
              date: now,
              event: "Counsellor Reassigned",
              detail: `Reassigned from '${item.counsellor || "Unassigned"}' to '${updatedFields.counsellor}'`,
            });
          }

          targetUpdatedLead = {
            ...item,
            ...updatedFields,
            timeline: timelineEvents,
          };

          return targetUpdatedLead;
        });
      });

      // API call to MySQL
      try {
        await fetch("/api/leads", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id,
            updatedFields: targetUpdatedLead || updatedFields,
          }),
        });
      } catch (err) {
        console.error("Error updating lead in MySQL:", err);
      }
    },
    []
  );

  // Quick update status
  const updateLeadStatus = useCallback(
    (id, newStatus) => {
      updateLead(id, { status: newStatus });
    },
    [updateLead]
  );

  // Delete lead (persists to MySQL)
  const deleteLead = useCallback(
    async (id) => {
      setLeads((prev) => prev.filter((item) => item.id !== id));

      try {
        await fetch(`/api/leads?id=${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
      } catch (err) {
        console.error("Error deleting lead from MySQL:", err);
      }
    },
    []
  );

  // Add a follow-up record (persists to MySQL)
  const addFollowUp = useCallback(
    async (leadId, followUpData) => {
      const now = new Date().toISOString();
      const newFollowUp = {
        id: "fu-" + Date.now(),
        date: now,
        ...followUpData,
      };

      let fullUpdatedLead = null;

      setLeads((prev) => {
        return prev.map((lead) => {
          if (lead.id !== leadId) return lead;

          const updatedTimeline = [
            {
              date: now,
              event: "Follow-up Logged",
              detail: `${followUpData.mode || "Call"}: ${followUpData.outcome || "Follow-up completed"}`,
            },
            ...(lead.timeline || []),
          ];

          fullUpdatedLead = {
            ...lead,
            status: followUpData.updateStatusTo || lead.status,
            followUps: [newFollowUp, ...(lead.followUps || [])],
            timeline: updatedTimeline,
          };

          return fullUpdatedLead;
        });
      });

      try {
        if (fullUpdatedLead) {
          await fetch("/api/leads", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: leadId,
              updatedFields: {
                status: fullUpdatedLead.status,
                followUps: fullUpdatedLead.followUps,
                timeline: fullUpdatedLead.timeline,
              },
            }),
          });
        }
      } catch (err) {
        console.error("Error saving follow-up to MySQL:", err);
      }
    },
    []
  );

  // Add internal note (persists to MySQL)
  const addNote = useCallback(
    async (leadId, noteText, authorName) => {
      const now = new Date().toISOString();
      const newNote = {
        id: "note-" + Date.now(),
        date: now,
        author: authorName || currentRole.name,
        text: noteText,
      };

      let fullUpdatedLead = null;

      setLeads((prev) => {
        return prev.map((lead) => {
          if (lead.id !== leadId) return lead;

          const updatedTimeline = [
            {
              date: now,
              event: "Note Added",
              detail: `Note by ${newNote.author}`,
            },
            ...(lead.timeline || []),
          ];

          fullUpdatedLead = {
            ...lead,
            notes: [newNote, ...(lead.notes || [])],
            timeline: updatedTimeline,
          };

          return fullUpdatedLead;
        });
      });

      try {
        if (fullUpdatedLead) {
          await fetch("/api/leads", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: leadId,
              updatedFields: {
                notes: fullUpdatedLead.notes,
                timeline: fullUpdatedLead.timeline,
              },
            }),
          });
        }
      } catch (err) {
        console.error("Error saving note to MySQL:", err);
      }
    },
    [currentRole.name]
  );

  // Bulk status update (persists to MySQL)
  const bulkUpdateStatus = useCallback(
    async (leadIds, newStatus) => {
      const now = new Date().toISOString();
      setLeads((prev) => {
        return prev.map((lead) => {
          if (!leadIds.includes(lead.id)) return lead;
          return {
            ...lead,
            status: newStatus,
            timeline: [
              {
                date: now,
                event: "Bulk Status Updated",
                detail: `Updated to ${newStatus} via bulk action`,
              },
              ...(lead.timeline || []),
            ],
          };
        });
      });

      try {
        await fetch("/api/leads", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "bulkUpdateStatus",
            leadIds,
            status: newStatus,
          }),
        });
      } catch (err) {
        console.error("Error bulk updating status in MySQL:", err);
      }
    },
    []
  );

  // Bulk assign counsellor (persists to MySQL)
  const bulkAssignCounsellor = useCallback(
    async (leadIds, counsellorName) => {
      const now = new Date().toISOString();
      setLeads((prev) => {
        return prev.map((lead) => {
          if (!leadIds.includes(lead.id)) return lead;
          return {
            ...lead,
            counsellor: counsellorName,
            timeline: [
              {
                date: now,
                event: "Bulk Counsellor Assigned",
                detail: `Assigned to ${counsellorName} via bulk action`,
              },
              ...(lead.timeline || []),
            ],
          };
        });
      });

      try {
        await fetch("/api/leads", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "bulkAssignCounsellor",
            leadIds,
            counsellor: counsellorName,
          }),
        });
      } catch (err) {
        console.error("Error bulk assigning counsellor in MySQL:", err);
      }
    },
    []
  );

  // Bulk delete leads (persists to MySQL)
  const bulkDeleteLeads = useCallback(
    async (leadIds) => {
      setLeads((prev) => prev.filter((lead) => !leadIds.includes(lead.id)));

      try {
        await fetch(`/api/leads?ids=${encodeURIComponent(leadIds.join(","))}`, {
          method: "DELETE",
        });
      } catch (err) {
        console.error("Error bulk deleting leads in MySQL:", err);
      }
    },
    []
  );

  // Reset to initial sample data in MySQL
  const resetToSampleData = useCallback(async () => {
    setLeads(INITIAL_LEADS);
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
    } catch (err) {
      console.error("Error resetting data in MySQL:", err);
    }
  }, []);

  // Role-filtered leads view
  const visibleLeads = useMemo(() => {
    if (currentRole.permissions.viewAllLeads) {
      return leads;
    }
    // For Counsellor role: show leads assigned to current counsellor or unassigned
    return leads.filter(
      (l) => l.counsellor === currentRole.name || !l.counsellor || l.counsellor === "Unassigned"
    );
  }, [leads, currentRole]);

  // Metrics computation for summary cards
  const metrics = useMemo(() => {
    const total = visibleLeads.length;

    // Leads punched today
    const today = new Date().toISOString().split("T")[0];
    const todayLeads = visibleLeads.filter((l) => l.punchDate && l.punchDate.startsWith(today)).length;

    const primaryLeads = visibleLeads.filter((l) => l.leadType === "Primary").length;
    const duplicateLeads = visibleLeads.filter((l) => l.leadType === "Duplicate").length;

    // 5 Admission Status metrics
    const newLeads = visibleLeads.filter((l) => l.status === "New Lead" || l.status === "Pending").length;
    const registrationPaid = visibleLeads.filter((l) => l.status === "Registration Paid" || l.status === "Follow-up").length;
    const partiallyFeeCollected = visibleLeads.filter((l) => l.status === "Partially Fee Collected").length;
    const feesPaid = visibleLeads.filter((l) => l.status === "Fees Paid").length;
    const admissionApproved = visibleLeads.filter((l) => l.status === "Admission Approved" || l.status === "Admitted").length;

    const conversionRate = total > 0 ? ((admissionApproved / total) * 100).toFixed(1) : 0;

    return {
      total,
      todayLeads,
      primaryLeads,
      duplicateLeads,
      newLeads,
      registrationPaid,
      partiallyFeeCollected,
      feesPaid,
      admissionApproved,
      // Compatibility aliases
      pendingAdmissions: newLeads,
      followUpAdmissions: registrationPaid,
      totalAdmitted: admissionApproved,
      conversionRate,
    };
  }, [visibleLeads]);

  return {
    leads,
    visibleLeads,
    isLoaded,
    currentRole,
    currentRoleKey,
    isAuthenticated,
    login,
    logout,
    switchRole,
    checkDuplicate,
    addLead,
    updateLead,
    updateLeadStatus,
    deleteLead,
    addFollowUp,
    addNote,
    bulkUpdateStatus,
    bulkAssignCounsellor,
    bulkDeleteLeads,
    resetToSampleData,
    metrics,
  };
}
