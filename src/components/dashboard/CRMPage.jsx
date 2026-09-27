"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Calendar,
  Sparkles,
  Copy,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { MetricCards } from "@/components/dashboard/MetricCards";
import { TableToolbar } from "@/components/dashboard/TableToolbar";
import { LeadsTable } from "@/components/dashboard/LeadsTable";
import { LeadDetailsSheet } from "@/components/dashboard/LeadDetailsSheet";
import { AddEditLeadDialog } from "@/components/dashboard/AddEditLeadDialog";
import { QuickContactModal } from "@/components/dashboard/QuickContactModal";
import { DeleteConfirmDialog } from "@/components/dashboard/DeleteConfirmDialog";
import { BulkActionsBar } from "@/components/dashboard/BulkActionsBar";
import { LoginScreen } from "@/components/dashboard/LoginScreen";
import { Skeleton } from "@/components/ui/Skeleton";
import { useLeads } from "@/hooks/useLeads";
import { useToast } from "@/components/ui/Toast";
import { fireAdmissionConfetti } from "@/lib/confetti";
import { formatDate } from "@/lib/utils";

export function CRMPage() {
  const {
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
  } = useLeads();

  const { addToast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoaded) {
      if (!isAuthenticated) {
        router.push("/");
      } else {
        if (currentRoleKey === "ADMIN" && pathname !== "/admin/crm") {
          router.replace("/admin/crm");
        } else if (currentRoleKey !== "ADMIN" && pathname === "/admin/crm") {
          router.replace("/crm");
        }
      }
    }
  }, [isLoaded, isAuthenticated, currentRoleKey, pathname, router]);

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [presetFilter, setPresetFilter] = useState("ALL"); // ALL, TODAY, PRIMARY, DUPLICATE, PENDING, ADMITTED

  const [filters, setFilters] = useState({
    leadType: "ALL",
    status: "ALL",
    dateRange: "ALL",
    college: "ALL",
    course: "ALL",
    center: "ALL",
    counsellor: "ALL",
  });

  // Table options state
  const [sortConfig, setSortConfig] = useState({
    key: "punchDate",
    direction: "desc",
  });

  const [columnsVisibility, setColumnsVisibility] = useState({
    name: true,
    punchDate: true,
    mobile: true,
    email: true,
    college: true,
    course: true,
    leadType: true,
    center: true,
    counsellor: true,
    status: true,
  });

  const [density, setDensity] = useState("default"); // compact, default, relaxed
  const [selectedIds, setSelectedIds] = useState([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Dialog & Sheet States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [viewingLead, setViewingLead] = useState(null);

  const [contactModalData, setContactModalData] = useState({
    open: false,
    lead: null,
    type: "call",
  });

  const [deleteConfirmData, setDeleteConfirmData] = useState({
    open: false,
    lead: null,
    isBulk: false,
  });

  // Handle Preset card clicks
  const handleSelectPresetFilter = useCallback((presetId) => {
    setPresetFilter((prev) => (prev === presetId ? "ALL" : presetId));
    setCurrentPage(1);
  }, []);

  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  }, []);

  const handleResetFilters = useCallback(() => {
    setSearchQuery("");
    setPresetFilter("ALL");
    setFilters({
      leadType: "ALL",
      status: "ALL",
      dateRange: "ALL",
      college: "ALL",
      course: "ALL",
      center: "ALL",
      counsellor: "ALL",
    });
    setCurrentPage(1);
    addToast({
      title: "Filters Cleared",
      description: "All search queries and table filters have been reset.",
      type: "info",
    });
  }, [addToast]);

  const handleToggleColumn = useCallback((colKey) => {
    setColumnsVisibility((prev) => ({
      ...prev,
      [colKey]: !prev[colKey],
    }));
  }, []);

  const handleSort = useCallback((columnKey) => {
    setSortConfig((prev) => {
      if (prev.key === columnKey) {
        return {
          key: columnKey,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key: columnKey, direction: "asc" };
    });
  }, []);

  // Multi-selection handlers
  const handleToggleSelectRow = useCallback((id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const handleToggleSelectAll = useCallback((pageIds) => {
    setSelectedIds((prev) => {
      const allSelected = pageIds.every((id) => prev.includes(id));
      if (allSelected) {
        return prev.filter((id) => !pageIds.includes(id));
      }
      return Array.from(new Set([...prev, ...pageIds]));
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  // Core Lead Actions
  const handleSaveLead = useCallback(
    (leadData) => {
      if (editingLead) {
        updateLead(editingLead.id, leadData);
        addToast({
          title: "Lead Updated",
          description: `Successfully updated details for ${leadData.name}.`,
          type: "success",
        });
        setEditingLead(null);
      } else {
        const { lead: createdLead, duplicateInfo } = addLead(leadData);
        if (duplicateInfo.isDuplicate) {
          addToast({
            title: "Duplicate Lead Punched",
            description: `Lead #${createdLead.id} created and linked to Primary Lead #${duplicateInfo.matchedLead.id}.`,
            type: "warning",
            duration: 6000,
          });
        } else {
          addToast({
            title: "Lead Punched Successfully",
            description: `Primary Lead #${createdLead.id} registered for ${createdLead.name}.`,
            type: "success",
          });
        }
      }
    },
    [editingLead, updateLead, addLead, addToast]
  );

  const handleQuickStatusChange = useCallback(
    (leadId, newStatus) => {
      updateLeadStatus(leadId, newStatus);
      if (newStatus === "Admission Approved" || newStatus === "Admitted") {
        fireAdmissionConfetti();
        addToast({
          title: "🎉 Admission Approved!",
          description: "Candidate admission status confirmed & approved! Great job!",
          type: "success",
        });
      } else {
        addToast({
          title: "Status Updated",
          description: `Lead status changed to ${newStatus}.`,
          type: "info",
        });
      }

      // If viewing in sheet, update sheet state as well
      if (viewingLead && viewingLead.id === leadId) {
        setViewingLead((prev) => ({ ...prev, status: newStatus }));
      }
    },
    [updateLeadStatus, addToast, viewingLead]
  );

  const handleQuickCounsellorChange = useCallback(
    (leadId, newCounsellor) => {
      updateLead(leadId, { counsellor: newCounsellor });
      addToast({
        title: "Counsellor Reassigned",
        description: `Lead assigned to ${newCounsellor}.`,
        type: "info",
      });

      if (viewingLead && viewingLead.id === leadId) {
        setViewingLead((prev) => ({ ...prev, counsellor: newCounsellor }));
      }
    },
    [updateLead, addToast, viewingLead]
  );

  const handleDeleteLeadConfirm = useCallback(() => {
    if (deleteConfirmData.isBulk) {
      bulkDeleteLeads(selectedIds);
      addToast({
        title: "Leads Deleted",
        description: `Successfully removed ${selectedIds.length} lead records.`,
        type: "error",
      });
      setSelectedIds([]);
    } else if (deleteConfirmData.lead) {
      deleteLead(deleteConfirmData.lead.id);
      addToast({
        title: "Lead Deleted",
        description: `Lead #${deleteConfirmData.lead.id} permanently removed.`,
        type: "error",
      });
      if (viewingLead && viewingLead.id === deleteConfirmData.lead.id) {
        setViewingLead(null);
      }
    }
  }, [deleteConfirmData, selectedIds, bulkDeleteLeads, deleteLead, addToast, viewingLead]);

  const handleQuickContact = useCallback((lead, type) => {
    setContactModalData({
      open: true,
      lead,
      type,
    });
  }, []);

  const handleLogInteraction = useCallback(
    (leadId, interactionData) => {
      addFollowUp(leadId, interactionData);
      addToast({
        title: "Follow-up Logged",
        description: `Recorded ${interactionData.mode} interaction for candidate.`,
        type: "success",
      });
    },
    [addFollowUp, addToast]
  );

  // Bulk actions handlers
  const handleBulkStatusChange = useCallback(
    (newStatus) => {
      bulkUpdateStatus(selectedIds, newStatus);
      if (newStatus === "Admission Approved" || newStatus === "Admitted") {
        fireAdmissionConfetti();
      }
      addToast({
        title: "Bulk Status Updated",
        description: `Updated status to ${newStatus} for ${selectedIds.length} leads.`,
        type: "success",
      });
      setSelectedIds([]);
    },
    [bulkUpdateStatus, selectedIds, addToast]
  );

  const handleBulkAssignCounsellor = useCallback(
    (counsellorName) => {
      bulkAssignCounsellor(selectedIds, counsellorName);
      addToast({
        title: "Bulk Counsellor Assigned",
        description: `Assigned ${selectedIds.length} leads to ${counsellorName}.`,
        type: "success",
      });
      setSelectedIds([]);
    },
    [bulkAssignCounsellor, selectedIds, addToast]
  );

  // Export CSV
  const handleExportCSV = useCallback(
    (onlySelected = false) => {
      const recordsToExport = onlySelected
        ? visibleLeads.filter((l) => selectedIds.includes(l.id))
        : visibleLeads;

      if (recordsToExport.length === 0) {
        addToast({
          title: "Nothing to Export",
          description: "No leads matched current export criteria.",
          type: "warning",
        });
        return;
      }

      const headers = [
        "Lead ID",
        "Lead Name",
        "Punching Date & Time",
        "Mobile Number",
        "Email ID",
        "College",
        "Course",
        "Lead Type",
        "Unit Name",
        "Counsellor Name",
        "Lead Status",
        "Source",
      ];

      const csvRows = [
        headers.join(","),
        ...recordsToExport.map((l) =>
          [
            `"${l.id}"`,
            `"${l.name.replace(/"/g, '""')}"`,
            `"${formatDate(l.punchDate)}"`,
            `"${l.mobile}"`,
            `"${l.email}"`,
            `"${l.college.replace(/"/g, '""')}"`,
            `"${l.course.replace(/"/g, '""')}"`,
            `"${l.leadType}"`,
            `"${l.center.replace(/"/g, '""')}"`,
            `"${l.counsellor.replace(/"/g, '""')}"`,
            `"${l.status}"`,
            `"${l.source || ""}"`,
          ].join(",")
        ),
      ];

      const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `CompareDegree_Leads_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      addToast({
        title: "CSV Export Complete",
        description: `Exported ${recordsToExport.length} leads successfully.`,
        type: "success",
      });
    },
    [visibleLeads, selectedIds, addToast]
  );

  const handleImportCSV = useCallback(
    (file) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target.result;
        const lines = text.split(/\r?\n/).filter(line => line.trim());
        if (lines.length < 2) {
          addToast({ title: "Error", description: "CSV file is empty or missing headers.", type: "error" });
          return;
        }
        const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ''));
        
        const nameIdx = headers.findIndex(h => h.toLowerCase().includes("name") && !h.toLowerCase().includes("unit") && !h.toLowerCase().includes("counsellor"));
        const mobileIdx = headers.findIndex(h => h.toLowerCase().includes("mobile") || h.toLowerCase().includes("phone"));
        const emailIdx = headers.findIndex(h => h.toLowerCase().includes("email"));
        
        if (nameIdx === -1 || mobileIdx === -1) {
          addToast({ title: "Error", description: "CSV must contain Name and Mobile/Phone columns.", type: "error" });
          return;
        }

        let addedCount = 0;
        let duplicateCount = 0;

        for (let i = 1; i < lines.length; i++) {
          // Simple split by comma, ignoring commas in quotes isn't perfectly handled here but sufficient for basic CSVs
          const row = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)?.map(val => val.replace(/^"|"$/g, '')) || lines[i].split(",");
          if (!row[nameIdx] || !row[mobileIdx]) continue;
          
          const leadData = {
            name: row[nameIdx] || "Unknown",
            mobile: row[mobileIdx] || "Unknown",
            email: emailIdx !== -1 ? (row[emailIdx] || "") : "",
            college: "Other",
            course: "Other",
            center: "Online",
            source: "CSV Import"
          };
          
          const result = await addLead(leadData);
          if (result && result.duplicateInfo && result.duplicateInfo.isDuplicate) {
            duplicateCount++;
          } else {
            addedCount++;
          }
        }
        
        addToast({
          title: "CSV Import Complete",
          description: `Imported ${addedCount} new leads. Found ${duplicateCount} duplicates.`,
          type: "success"
        });
      };
      reader.readAsText(file);
    },
    [addLead, addToast]
  );

  // Filtered & Sorted Leads
  const processedLeads = useMemo(() => {
    let result = [...visibleLeads];

    // 1. Preset filter (from summary cards or quick tabs)
    if (presetFilter === "TODAY") {
      const today = new Date().toISOString().split("T")[0];
      result = result.filter((l) => l.punchDate && l.punchDate.startsWith(today));
    } else if (presetFilter === "PRIMARY") {
      result = result.filter((l) => l.leadType === "Primary");
    } else if (presetFilter === "DUPLICATE") {
      result = result.filter((l) => l.leadType === "Duplicate");
    } else if (presetFilter === "NEW_LEAD" || presetFilter === "PENDING") {
      result = result.filter((l) => l.status === "New Lead" || l.status === "Pending");
    } else if (presetFilter === "REGISTRATION_PAID") {
      result = result.filter((l) => l.status === "Registration Paid");
    } else if (presetFilter === "PARTIALLY_FEE_COLLECTED") {
      result = result.filter((l) => l.status === "Warm" || l.status === "Hot");
    } else if (presetFilter === "FEES_PAID") {
      result = result.filter((l) => l.status === "Fees Collected");
    } else if (presetFilter === "ADMISSION_APPROVED" || presetFilter === "ADMITTED") {
      result = result.filter((l) => l.status === "Admission Approved" || l.status === "Admitted");
    }

    // 2. Global Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((l) => {
        return (
          l.name.toLowerCase().includes(q) ||
          l.mobile.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          l.college.toLowerCase().includes(q) ||
          l.course.toLowerCase().includes(q) ||
          l.center.toLowerCase().includes(q) ||
          l.counsellor.toLowerCase().includes(q) ||
          l.id.toLowerCase().includes(q)
        );
      });
    }

    // 3. Dropdown Filters
    if (filters.leadType !== "ALL") {
      result = result.filter((l) => l.leadType === filters.leadType);
    }
    if (filters.status !== "ALL") {
      result = result.filter((l) => l.status === filters.status);
    }
    if (filters.college !== "ALL") {
      result = result.filter((l) => l.college === filters.college);
    }
    if (filters.course !== "ALL") {
      result = result.filter((l) => l.course === filters.course);
    }
    if (filters.center !== "ALL") {
      result = result.filter((l) => l.center === filters.center);
    }
    if (filters.counsellor !== "ALL") {
      result = result.filter((l) => l.counsellor === filters.counsellor);
    }

    // Date range filter
    if (filters.dateRange !== "ALL") {
      const now = new Date();
      if (filters.dateRange === "TODAY") {
        const todayStr = now.toISOString().split("T")[0];
        result = result.filter((l) => l.punchDate && l.punchDate.startsWith(todayStr));
      } else if (filters.dateRange === "YESTERDAY") {
        const yest = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        result = result.filter((l) => l.punchDate && l.punchDate.startsWith(yest));
      } else if (filters.dateRange === "LAST_7_DAYS") {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        result = result.filter((l) => new Date(l.punchDate) >= sevenDaysAgo);
      } else if (filters.dateRange === "THIS_MONTH") {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        result = result.filter((l) => new Date(l.punchDate) >= startOfMonth);
      }
    }

    // 4. Sorting
    result.sort((a, b) => {
      const fieldA = a[sortConfig.key];
      const fieldB = b[sortConfig.key];

      if (!fieldA && !fieldB) return 0;
      if (!fieldA) return 1;
      if (!fieldB) return -1;

      let comparison = 0;
      if (sortConfig.key === "punchDate") {
        comparison = new Date(fieldA).getTime() - new Date(fieldB).getTime();
      } else if (typeof fieldA === "string") {
        comparison = fieldA.localeCompare(fieldB);
      } else {
        comparison = fieldA > fieldB ? 1 : -1;
      }

      return sortConfig.direction === "asc" ? comparison : -comparison;
    });

    return result;
  }, [visibleLeads, presetFilter, searchQuery, filters, sortConfig]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#FBFBFC] flex items-center justify-center p-4">
        <Skeleton className="h-40 w-full max-w-md rounded-2xl" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // The useEffect will redirect
  }

  return (
    <div className="min-h-screen bg-[#FBFBFC] flex flex-col">
      {/* Header */}
      <Header
        currentRoleKey={currentRoleKey}
        onSwitchRole={switchRole}
        onLogout={logout}
        onOpenAddModal={() => {
          setEditingLead(null);
          setIsAddModalOpen(true);
        }}

        totalLeadsCount={leads.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Role Scoping Banner (for Counsellor view) */}
        {!currentRole.permissions.viewAllLeads && (
          <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-xs text-[#8B1E1E] flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-[#8B1E1E] animate-pulse" />
              <span>
                Logged in as <strong>{currentRole.name}</strong> ({currentRole.label}). Showing assigned leads and open unassigned leads.
              </span>
            </div>
            <button
              onClick={() => switchRole("ADMIN")}
              className="text-[#8B1E1E] underline font-bold hover:text-[#6D1414] text-[11px]"
            >
              Switch to Admin for full university view
            </button>
          </div>
        )}

        {/* Top Summary Metrics Cards */}
        <MetricCards
          metrics={metrics}
          activePresetFilter={presetFilter}
          onSelectPresetFilter={handleSelectPresetFilter}
        />

        {/* Quick Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-2 text-xs font-medium no-scrollbar">
          <button
            onClick={() => setPresetFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg border transition-all ${
              presetFilter === "ALL"
                ? "bg-[#8B1E1E] text-white border-[#8B1E1E] shadow-xs font-semibold"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            All Leads ({visibleLeads.length})
          </button>
          <button
            onClick={() => setPresetFilter("TODAY")}
            className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
              presetFilter === "TODAY"
                ? "bg-rose-700 text-white border-rose-700 shadow-xs font-semibold"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Calendar className="h-3 w-3" />
            <span>Today's Leads ({metrics.todayLeads})</span>
          </button>
          <button
            onClick={() => setPresetFilter("PRIMARY")}
            className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
              presetFilter === "PRIMARY"
                ? "bg-[#8B1E1E] text-white border-[#8B1E1E] shadow-xs font-semibold"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Sparkles className="h-3 w-3" />
            <span>Primary Inquiries ({metrics.primaryLeads})</span>
          </button>
          <button
            onClick={() => setPresetFilter("DUPLICATE")}
            className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
              presetFilter === "DUPLICATE"
                ? "bg-amber-600 text-white border-amber-600 shadow-xs font-semibold"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Copy className="h-3 w-3" />
            <span>Duplicate Inquiries ({metrics.duplicateLeads})</span>
          </button>
          <button
            onClick={() => setPresetFilter("NEW_LEAD")}
            className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
              presetFilter === "NEW_LEAD" || presetFilter === "PENDING"
                ? "bg-blue-700 text-white border-blue-700 shadow-xs font-semibold"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Clock className="h-3 w-3" />
            <span>New Lead ({metrics.newLeads})</span>
          </button>
          <button
            onClick={() => setPresetFilter("REGISTRATION_PAID")}
            className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
              presetFilter === "REGISTRATION_PAID"
                ? "bg-purple-700 text-white border-purple-700 shadow-xs font-semibold"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
            <span>Registration Paid ({metrics.registrationPaid})</span>
          </button>
          <button
            onClick={() => setPresetFilter("PARTIALLY_FEE_COLLECTED")}
            className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
              presetFilter === "PARTIALLY_FEE_COLLECTED"
                ? "bg-amber-700 text-white border-amber-700 shadow-xs font-semibold"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            <span>Warm / Hot ({metrics.partiallyFeeCollected})</span>
          </button>
          <button
            onClick={() => setPresetFilter("FEES_PAID")}
            className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
              presetFilter === "FEES_PAID"
                ? "bg-teal-700 text-white border-teal-700 shadow-xs font-semibold"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
            <span>Fees Collected ({metrics.feesPaid})</span>
          </button>
          <button
            onClick={() => setPresetFilter("ADMISSION_APPROVED")}
            className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
              presetFilter === "ADMISSION_APPROVED" || presetFilter === "ADMITTED"
                ? "bg-emerald-700 text-white border-emerald-700 shadow-xs font-semibold"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <CheckCircle2 className="h-3 w-3" />
            <span>Admission Approved ({metrics.admissionApproved})</span>
          </button>
        </div>

        {/* Powerful Table Toolbar */}
        <TableToolbar
          searchQuery={searchQuery}
          onSearchChange={(val) => {
            setSearchQuery(val);
            setCurrentPage(1);
          }}
          filters={filters}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          columnsVisibility={columnsVisibility}
          onToggleColumn={handleToggleColumn}
          density={density}
          onDensityChange={setDensity}
          onExportCSV={() => handleExportCSV(false)}
          onImportCSV={handleImportCSV}
          totalResultsCount={processedLeads.length}
        />

        {/* Leads Data Table or Loading Skeleton */}
        {!isLoaded ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        ) : (
          <LeadsTable
            leads={processedLeads}
            columnsVisibility={columnsVisibility}
            density={density}
            sortConfig={sortConfig}
            onSort={handleSort}
            selectedIds={selectedIds}
            onToggleSelectRow={handleToggleSelectRow}
            onToggleSelectAll={handleToggleSelectAll}
            onViewLead={(lead) => setViewingLead(lead)}
            onEditLead={(lead) => {
              setEditingLead(lead);
              setIsAddModalOpen(true);
            }}
            onDeleteLead={(lead) => {
              setDeleteConfirmData({
                open: true,
                lead,
                isBulk: false,
              });
            }}
            onQuickStatusChange={handleQuickStatusChange}
            onQuickCounsellorChange={handleQuickCounsellorChange}
            onQuickContact={handleQuickContact}
            canDelete={currentRole.permissions.canDeleteLeads}
            canAssignCounsellor={currentRole.permissions.canAssignCounsellor}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
          />
        )}
      </main>

      {/* Bulk Actions Floating Bar */}
      <BulkActionsBar
        selectedIds={selectedIds}
        onClearSelection={handleClearSelection}
        onBulkStatusChange={handleBulkStatusChange}
        onBulkAssignCounsellor={handleBulkAssignCounsellor}
        onBulkDelete={() => {
          setDeleteConfirmData({
            open: true,
            lead: null,
            isBulk: true,
          });
        }}
        onExportSelected={() => handleExportCSV(true)}
        canDelete={currentRole.permissions.canDeleteLeads}
        canAssign={currentRole.permissions.canAssignCounsellor}
      />

      {/* Add / Edit Lead Dialog */}
      <AddEditLeadDialog
        open={isAddModalOpen}
        onOpenChange={(val) => {
          setIsAddModalOpen(val);
          if (!val) setEditingLead(null);
        }}
        editingLead={editingLead}
        onSave={handleSaveLead}
        checkDuplicate={checkDuplicate}
      />

      {/* Complete Lead Profile Sheet / Drawer */}
      <LeadDetailsSheet
        open={Boolean(viewingLead)}
        onOpenChange={(open) => {
          if (!open) setViewingLead(null);
        }}
        lead={viewingLead}
        onEditLead={(lead) => {
          setEditingLead(lead);
          setIsAddModalOpen(true);
        }}
        onDeleteLead={(lead) => {
          setDeleteConfirmData({
            open: true,
            lead,
            isBulk: false,
          });
        }}
        onStatusChange={handleQuickStatusChange}
        onCounsellorChange={handleQuickCounsellorChange}
        onAddFollowUp={handleLogInteraction}
        onAddNote={(leadId, noteText) => {
          addNote(leadId, noteText, currentRole.name);
          addToast({
            title: "Note Added",
            description: "Internal counsellor note saved.",
            type: "info",
          });
        }}
        onQuickContact={handleQuickContact}
        onViewRelatedLead={(related) => setViewingLead(related)}
        canDelete={currentRole.permissions.canDeleteLeads}
        canAssignCounsellor={currentRole.permissions.canAssignCounsellor}
        allLeads={leads}
      />

      {/* Quick Contact Modal (Call log / WhatsApp / Email) */}
      <QuickContactModal
        open={contactModalData.open}
        onOpenChange={(val) =>
          setContactModalData((prev) => ({ ...prev, open: val }))
        }
        lead={contactModalData.lead}
        type={contactModalData.type}
        onLogInteraction={handleLogInteraction}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteConfirmData.open}
        onOpenChange={(val) =>
          setDeleteConfirmData((prev) => ({ ...prev, open: val }))
        }
        targetLead={deleteConfirmData.lead}
        isBulk={deleteConfirmData.isBulk}
        count={selectedIds.length}
        onConfirm={handleDeleteLeadConfirm}
      />
    </div>
  );
}
