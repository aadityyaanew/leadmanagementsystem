"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { INITIAL_LEADS } from "@/data/initialLeads";
import { USER_ROLES } from "@/lib/constants";

const STORAGE_KEY = "crm_lms_leads_data_v2";
const ROLE_STORAGE_KEY = "crm_lms_current_role_v1";

function normalizePhone(phone = "") {
  return phone.replace(/[^0-9]/g, "").slice(-10); // get last 10 digits
}

function normalizeEmail(email = "") {
  return email.trim().toLowerCase();
}

function migrateLeadStatus(status) {
  if (!status) return "New Lead";
  switch (status) {
    case "Pending":
      return "New Lead";
    case "Follow-up":
      return "Registration Paid";
    case "Admitted":
      return "Admission Approved";
    case "Not Interested":
      return "Partially Fee Collected";
    case "Cancelled":
    case "Lost":
      return "New Lead";
    default:
      return status;
  }
}

export function useLeads() {
  const [leads, setLeads] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentRoleKey, setCurrentRoleKey] = useState("ADMIN");

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load leads and role from localStorage on mount
  useEffect(() => {
    try {
      const savedLeads = localStorage.getItem(STORAGE_KEY);
      if (savedLeads) {
        const parsed = JSON.parse(savedLeads);
        const migrated = parsed.map((lead) => ({
          ...lead,
          status: migrateLeadStatus(lead.status),
        }));
        setLeads(migrated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      } else {
        // Check for legacy v1 data
        const legacyLeads = localStorage.getItem("crm_lms_leads_data_v1");
        if (legacyLeads) {
          const parsed = JSON.parse(legacyLeads);
          const migrated = parsed.map((lead) => ({
            ...lead,
            status: migrateLeadStatus(lead.status),
          }));
          setLeads(migrated);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        } else {
          setLeads(INITIAL_LEADS);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_LEADS));
        }
      }

      const savedRole = localStorage.getItem(ROLE_STORAGE_KEY);
      const isAuth = localStorage.getItem("crm_lms_is_auth") === "true";
      if (savedRole && USER_ROLES[savedRole]) {
        setCurrentRoleKey(savedRole);
      }
      setIsAuthenticated(isAuth);
    } catch (e) {
      console.error("Error loading leads from localStorage:", e);
      setLeads(INITIAL_LEADS);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save leads to localStorage whenever state updates
  const saveLeadsToStorage = useCallback((newLeads) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newLeads));
    } catch (e) {
      console.error("Failed to persist leads:", e);
    }
  }, []);

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

  // Add a new lead
  const addLead = useCallback(
    (leadData) => {
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

      setLeads((prev) => {
        let updated = [newLead, ...prev];

        // If duplicate, increment duplicateCount on the primary lead
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

        saveLeadsToStorage(updated);
        return updated;
      });

      return { lead: newLead, duplicateInfo: dupCheck };
    },
    [checkDuplicate, saveLeadsToStorage]
  );

  // Update existing lead
  const updateLead = useCallback(
    (id, updatedFields) => {
      const now = new Date().toISOString();
      setLeads((prev) => {
        const updated = prev.map((item) => {
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

          return {
            ...item,
            ...updatedFields,
            timeline: timelineEvents,
          };
        });

        saveLeadsToStorage(updated);
        return updated;
      });
    },
    [saveLeadsToStorage]
  );

  // Quick update status
  const updateLeadStatus = useCallback(
    (id, newStatus) => {
      updateLead(id, { status: newStatus });
    },
    [updateLead]
  );

  // Delete lead
  const deleteLead = useCallback(
    (id) => {
      setLeads((prev) => {
        const updated = prev.filter((item) => item.id !== id);
        saveLeadsToStorage(updated);
        return updated;
      });
    },
    [saveLeadsToStorage]
  );

  // Add a follow-up record
  const addFollowUp = useCallback(
    (leadId, followUpData) => {
      const now = new Date().toISOString();
      const newFollowUp = {
        id: "fu-" + Date.now(),
        date: now,
        ...followUpData,
      };

      setLeads((prev) => {
        const updated = prev.map((lead) => {
          if (lead.id !== leadId) return lead;

          const updatedTimeline = [
            {
              date: now,
              event: "Follow-up Logged",
              detail: `${followUpData.mode || "Call"}: ${followUpData.outcome || "Follow-up completed"}`,
            },
            ...(lead.timeline || []),
          ];

          return {
            ...lead,
            status: followUpData.updateStatusTo || lead.status,
            followUps: [newFollowUp, ...(lead.followUps || [])],
            timeline: updatedTimeline,
          };
        });

        saveLeadsToStorage(updated);
        return updated;
      });
    },
    [saveLeadsToStorage]
  );

  // Add internal note
  const addNote = useCallback(
    (leadId, noteText, authorName) => {
      const now = new Date().toISOString();
      const newNote = {
        id: "note-" + Date.now(),
        date: now,
        author: authorName || currentRole.name,
        text: noteText,
      };

      setLeads((prev) => {
        const updated = prev.map((lead) => {
          if (lead.id !== leadId) return lead;

          const updatedTimeline = [
            {
              date: now,
              event: "Note Added",
              detail: `Note by ${newNote.author}`,
            },
            ...(lead.timeline || []),
          ];

          return {
            ...lead,
            notes: [newNote, ...(lead.notes || [])],
            timeline: updatedTimeline,
          };
        });

        saveLeadsToStorage(updated);
        return updated;
      });
    },
    [currentRole.name, saveLeadsToStorage]
  );

  // Bulk status update
  const bulkUpdateStatus = useCallback(
    (leadIds, newStatus) => {
      const now = new Date().toISOString();
      setLeads((prev) => {
        const updated = prev.map((lead) => {
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
        saveLeadsToStorage(updated);
        return updated;
      });
    },
    [saveLeadsToStorage]
  );

  // Bulk assign counsellor
  const bulkAssignCounsellor = useCallback(
    (leadIds, counsellorName) => {
      const now = new Date().toISOString();
      setLeads((prev) => {
        const updated = prev.map((lead) => {
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
        saveLeadsToStorage(updated);
        return updated;
      });
    },
    [saveLeadsToStorage]
  );

  // Bulk delete leads
  const bulkDeleteLeads = useCallback(
    (leadIds) => {
      setLeads((prev) => {
        const updated = prev.filter((lead) => !leadIds.includes(lead.id));
        saveLeadsToStorage(updated);
        return updated;
      });
    },
    [saveLeadsToStorage]
  );

  // Reset to initial sample data
  const resetToSampleData = useCallback(() => {
    setLeads(INITIAL_LEADS);
    saveLeadsToStorage(INITIAL_LEADS);
  }, [saveLeadsToStorage]);

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
