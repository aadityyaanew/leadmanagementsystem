"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Phone,
  PhoneCall,
  Mail,
  Calendar,
  Clock,
  User,
  Users,
  Search,
  RefreshCw,
  Filter,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Download,
  Flame,
  Shield,
  Building2,
  ChevronRight,
  PhoneMissed,
  Timer,
  AlertCircle,
  X,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { formatDate, formatRelativeTime } from "@/lib/utils";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return "0s";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}

function getOutcomeCategory(disposition = "") {
  const text = (disposition || "").toLowerCase();
  if (
    text.includes("connected") ||
    text.includes("discussion") ||
    text.includes("interested") ||
    text.includes("callback") ||
    text.includes("approved") ||
    text.includes("enrolled")
  ) {
    return {
      type: "connected",
      label: "Connected",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      dotClass: "bg-emerald-500",
      icon: CheckCircle2,
    };
  }
  if (
    text.includes("ringing") ||
    text.includes("no answer") ||
    text.includes("busy") ||
    text.includes("disconnected") ||
    text.includes("unanswered") ||
    text.includes("switch off") ||
    text.includes("not reachable") ||
    text.includes("declined")
  ) {
    return {
      type: "unanswered",
      label: "Unanswered / Busy",
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
      dotClass: "bg-amber-500",
      icon: PhoneMissed,
    };
  }
  return {
    type: "neutral",
    label: "Follow-up Logged",
    badgeClass: "bg-slate-50 text-slate-700 border-slate-200",
    dotClass: "bg-slate-400",
    icon: Phone,
  };
}

export function ReportsView({ forcedRole = null }) {
  const { session, isLoaded: authLoaded } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    role: "Admin",
    currentUser: {},
    todaySummary: { total_today: 0, unique_today: 0, phone_today: 0, email_today: 0, connected_today: 0, unanswered_today: 0, duration_today: 0, active_counsellors: 0 },
    weekSummary: { total_week: 0, unique_week: 0, connected_week: 0, unanswered_week: 0, duration_week: 0 },
    monthSummary: { total_month: 0, unique_month: 0, connected_month: 0, unanswered_month: 0, duration_month: 0 },
    counsellorDailyStats: [],
    dateWiseStats: [],
    logs: [],
    counsellors: [],
    unitHeads: [],
    units: [],
    dispositionBreakdown: [],
    availableDispositions: [],
  });

  // Filter States
  const [dateRange, setDateRange] = useState("today"); // today, yesterday, week, month, this_month, all
  const [selectedUnit, setSelectedUnit] = useState("ALL");
  const [selectedCounsellor, setSelectedCounsellor] = useState("ALL");
  const [selectedUnitHead, setSelectedUnitHead] = useState("ALL");
  const [selectedDisposition, setSelectedDisposition] = useState("ALL");
  const [selectedOutcome, setSelectedOutcome] = useState("ALL"); // ALL, connected, unanswered
  const [selectedType, setSelectedType] = useState("ALL"); // ALL, Phone Call, Email Follow-up
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "datewise" | "logs"

  // Effective role from session or forced prop
  const effectiveRole = useMemo(() => {
    if (forcedRole && forcedRole !== "Admin") return forcedRole;
    if (session?.role) return session.role;
    return data.role || "Admin";
  }, [forcedRole, session, data.role]);

  const isCounsellor = effectiveRole === "Counsellor";
  const isUnitHead = effectiveRole === "UnitHead";
  const isAdmin = effectiveRole === "Admin";

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        dateRange,
        counsellor: selectedCounsellor,
        outcome: selectedOutcome,
        type: selectedType,
        search,
      });

      if (selectedUnit && selectedUnit !== "ALL") {
        params.set("unit", selectedUnit);
      }

      if (selectedDisposition && selectedDisposition !== "ALL") {
        params.set("disposition", selectedDisposition);
      }

      if (isAdmin && selectedUnitHead && selectedUnitHead !== "ALL") {
        params.set("unitHead", selectedUnitHead);
      }

      // If session exists in client, pass verification header
      const headers = {};
      if (session) {
        headers["x-user-session"] = encodeURIComponent(JSON.stringify(session));
      }

      const res = await fetch(`/api/admin/reports?${params.toString()}`, { headers });
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        throw new Error(json.error || "Failed to load reports");
      }
    } catch (err) {
      console.error("Error loading reports:", err);
      setError(err.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [dateRange, selectedUnit, selectedCounsellor, selectedUnitHead, selectedDisposition, selectedOutcome, selectedType, search, isAdmin, session]);

  useEffect(() => {
    if (authLoaded) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchReports();
    }
  }, [authLoaded, fetchReports]);

  // Export logs to CSV
  const handleExportCSV = () => {
    if (!data.logs || data.logs.length === 0) return;
    const headers = [
      "ID",
      "Lead ID",
      "Student Name",
      "Phone",
      "Unit",
      "Counsellor",
      "Type",
      "Outcome / Disposition",
      "Duration (sec)",
      "Notes",
      "Date & Time (IST)",
    ];
    const rows = data.logs.map((l) => [
      l.id,
      l.lead_id,
      `"${(l.lead_name || "").replace(/"/g, '""')}"`,
      l.lead_phone || "",
      `"${(l.unit_name || "").replace(/"/g, '""')}"`,
      `"${(l.counsellor_name || "").replace(/"/g, '""')}"`,
      l.call_type || "",
      `"${(l.disposition || "").replace(/"/g, '""')}"`,
      l.duration || 0,
      `"${(l.notes || "").replace(/"/g, '""')}"`,
      l.call_time_ist ? `"${l.call_time_ist}"` : (l.created_at ? new Date(l.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : ""),
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const roleSlug = effectiveRole.toLowerCase();
    link.setAttribute("download", `${roleSlug}_call_report_${dateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Connected rate calculations
  const todayConnectedRate = data.todaySummary.total_today > 0
    ? Math.round((data.todaySummary.connected_today / data.todaySummary.total_today) * 100)
    : 0;

  const weekConnectedRate = data.weekSummary.total_week > 0
    ? Math.round((data.weekSummary.connected_week / data.weekSummary.total_week) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* ── Top Header Bar ───────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {isCounsellor && "My Call Activity & Performance"}
              {isUnitHead && "Team Call Reports"}
              {isAdmin && "Reports & Call Analytics"}
            </h1>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                isCounsellor
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : isUnitHead
                  ? "bg-purple-50 text-purple-700 border-purple-200"
                  : "bg-rose-50 text-[#8B1E1E] border-rose-200"
              }`}
            >
              {isCounsellor && (
                <>
                  <User className="h-3 w-3" /> Counsellor: {session?.name || data.currentUser?.name || "Self"}
                </>
              )}
              {isUnitHead && (
                <>
                  <Building2 className="h-3 w-3" /> Unit Head: {session?.name || data.currentUser?.name || "Team"}
                </>
              )}
              {isAdmin && (
                <>
                  <Shield className="h-3 w-3" /> Organization Wide
                </>
              )}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            {isCounsellor && "Track your daily calls, response outcomes, date-wise counts, and student conversation history."}
            {isUnitHead && "Monitor your assigned counsellors' daily calling output, team totals, and outreach details."}
            {isAdmin && "Comprehensive organization-wide outreach analytics, Unit Head breakdown, and counsellor calling logs."}
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={fetchReports}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-60"
            title="Reload reports data"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleExportCSV}
            disabled={!data.logs || data.logs.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#8B1E1E] text-white text-xs font-semibold hover:bg-[#6d1414] transition-colors shadow-xs disabled:opacity-50"
            title="Download CSV report"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ── Error Banner ─────────────────────────────────────────────────── */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchReports}
            className="text-xs font-semibold underline hover:no-underline text-rose-900 ml-4"
          >
            Try Again
          </button>
        </div>
      )}

      {/* ── KPI Summary Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today Calls */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-sm transition-all relative overflow-hidden">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl border flex items-center justify-center flex-shrink-0 bg-rose-50 text-[#8B1E1E] border-rose-100">
              <PhoneCall className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 tracking-tight">
                {data.todaySummary.total_today}
              </p>
              <p className="text-xs font-semibold text-slate-600">
                {isCounsellor ? "My Calls Today" : isUnitHead ? "Team Calls Today" : "Total Calls Today"}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                <span className="font-semibold text-slate-700">{data.todaySummary.unique_today || 0}</span> unique numbers reached
              </p>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Connected:</span>
            <span className="font-semibold text-emerald-700">
              {data.todaySummary.connected_today} ({todayConnectedRate}%)
            </span>
          </div>
        </div>

        {/* Card 2: This Week Total */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-sm transition-all">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl border flex items-center justify-center flex-shrink-0 bg-blue-50 text-blue-700 border-blue-100">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 tracking-tight">
                {data.weekSummary.total_week}
              </p>
              <p className="text-xs font-semibold text-slate-600">This Week Outreach</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                <span className="font-semibold text-slate-700">{data.weekSummary.unique_week || 0}</span> unique numbers (7d)
              </p>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Weekly Success:</span>
            <span className="font-semibold text-blue-700">
              {data.weekSummary.connected_week} ({weekConnectedRate}%)
            </span>
          </div>
        </div>

        {/* Card 3: This Month Total */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-sm transition-all">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl border flex items-center justify-center flex-shrink-0 bg-purple-50 text-purple-700 border-purple-100">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 tracking-tight">
                {data.monthSummary.total_month}
              </p>
              <p className="text-xs font-semibold text-slate-600">This Month Total</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                <span className="font-semibold text-slate-700">{data.monthSummary.unique_month || 0}</span> unique numbers (30d)
              </p>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Connected Month:</span>
            <span className="font-semibold text-purple-700">{data.monthSummary.connected_month}</span>
          </div>
        </div>

        {/* Card 4: Active Counsellors / Outcomes */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-sm transition-all">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl border flex items-center justify-center flex-shrink-0 bg-emerald-50 text-emerald-700 border-emerald-100">
              {isCounsellor ? <Timer className="h-6 w-6" /> : <Users className="h-6 w-6" />}
            </div>
            <div>
              {isCounsellor ? (
                <>
                  <p className="text-2xl font-bold text-slate-900 tracking-tight">
                    {formatDuration(data.todaySummary.duration_today)}
                  </p>
                  <p className="text-xs font-semibold text-slate-600">Total Talk Time Today</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Missed today: {data.todaySummary.unanswered_today}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold text-slate-900 tracking-tight">
                    {data.todaySummary.active_counsellors}
                    <span className="text-xs font-normal text-slate-400 ml-1">
                      / {data.counsellorDailyStats.length}
                    </span>
                  </p>
                  <p className="text-xs font-semibold text-slate-600">
                    {isUnitHead ? "Team Counsellors Active" : "Active Counsellors"}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Calling today</p>
                </>
              )}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Unanswered Today:</span>
            <span className="font-semibold text-amber-700">{data.todaySummary.unanswered_today}</span>
          </div>
        </div>
      </div>

      {/* ── Filters & View Tabs ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* View Tabs */}
          <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl self-start">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "overview"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {isCounsellor ? "Call Activity" : "Performance Overview"}
            </button>
            <button
              onClick={() => setActiveTab("datewise")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "datewise"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Date-wise Summary
            </button>
            <button
              onClick={() => setActiveTab("logs")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "logs"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Call History ({data.logs.length})
            </button>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search candidate, phone, notes…"
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs w-48 sm:w-60 focus:outline-none focus:ring-2 focus:ring-[#8B1E1E]/20 focus:border-[#8B1E1E]"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Date Range Selector */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="h-8 rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#8B1E1E]/20 focus:border-[#8B1E1E]"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">Last 7 Days</option>
              <option value="this_month">This Month</option>
              <option value="month">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>

            {/* Unit Filter (Admin & Unit Head) */}
            {!isCounsellor && data.units && data.units.length > 0 && (
              <select
                value={selectedUnit}
                onChange={(e) => {
                  setSelectedUnit(e.target.value);
                  setSelectedCounsellor("ALL"); // Reset counsellor filter
                }}
                className="h-8 rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#8B1E1E]/20 focus:border-[#8B1E1E]"
              >
                <option value="ALL">All Units</option>
                {data.units.map((u) => (
                  <option key={u.id || u.name} value={u.name}>
                    {u.name}
                  </option>
                ))}
              </select>
            )}

            {/* Unit Head Filter (Admin Only) */}
            {isAdmin && data.unitHeads && data.unitHeads.length > 0 && (
              <select
                value={selectedUnitHead}
                onChange={(e) => {
                  setSelectedUnitHead(e.target.value);
                  setSelectedCounsellor("ALL"); // Reset counsellor filter
                }}
                className="h-8 rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#8B1E1E]/20 focus:border-[#8B1E1E]"
              >
                <option value="ALL">All Unit Heads</option>
                {data.unitHeads.map((uh) => (
                  <option key={uh.id} value={uh.id}>
                    {uh.name} {uh.unit_name ? `(${uh.unit_name})` : ""}
                  </option>
                ))}
              </select>
            )}

            {/* Counsellor Filter (Unit Head & Admin) */}
            {!isCounsellor && data.counsellors && data.counsellors.length > 0 && (
              <select
                value={selectedCounsellor}
                onChange={(e) => setSelectedCounsellor(e.target.value)}
                className="h-8 rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#8B1E1E]/20 focus:border-[#8B1E1E]"
              >
                <option value="ALL">
                  {isUnitHead ? "All Team Counsellors" : "All Counsellors"}
                </option>
                {data.counsellors.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}

            {/* Specific Disposition Filter */}
            {data.availableDispositions && data.availableDispositions.length > 0 && (
              <select
                value={selectedDisposition}
                onChange={(e) => setSelectedDisposition(e.target.value)}
                className="h-8 rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#8B1E1E]/20 focus:border-[#8B1E1E]"
              >
                <option value="ALL">All Dispositions</option>
                {data.availableDispositions.map((disp) => (
                  <option key={disp} value={disp}>
                    {disp}
                  </option>
                ))}
              </select>
            )}

            {/* Call Outcome Category Filter */}
            <select
              value={selectedOutcome}
              onChange={(e) => setSelectedOutcome(e.target.value)}
              className="h-8 rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#8B1E1E]/20 focus:border-[#8B1E1E]"
            >
              <option value="ALL">All Outcomes</option>
              <option value="connected">Connected / Successful</option>
              <option value="unanswered">Unanswered / Missed / Busy</option>
            </select>

            {/* Outreach Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="h-8 rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#8B1E1E]/20 focus:border-[#8B1E1E]"
            >
              <option value="ALL">All Channels</option>
              <option value="Phone Call">Phone Calls</option>
              <option value="Email Follow-up">Email</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── TAB 1: OVERVIEW / TEAM PERFORMANCE TABLE ─────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {!isCounsellor && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-[#8B1E1E]" />
                    {isUnitHead ? "Assigned Counsellors Performance" : "Counsellor Calling Performance"}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Breakdown of today, weekly, and monthly calls per counsellor with outcome rates
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-rose-50 text-[#8B1E1E] border border-rose-100">
                  {dateRange === "today" ? "Today" : dateRange.replace("_", " ").toUpperCase()}
                </span>
              </div>

              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <RefreshCw className="h-6 w-6 animate-spin text-[#8B1E1E]" />
                  <p className="text-xs font-medium">Loading performance data…</p>
                </div>
              ) : data.counsellorDailyStats.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <PhoneCall className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-medium">No calls logged by assigned counsellors yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold">
                      <tr>
                        <th className="px-4 py-3 text-left">Counsellor Name</th>
                        <th className="px-4 py-3 text-center">Calls Today</th>
                        <th className="px-4 py-3 text-center">Unique Numbers (Today)</th>
                        <th className="px-4 py-3 text-center">Last 7 Days</th>
                        <th className="px-4 py-3 text-center">Last 30 Days</th>
                        <th className="px-4 py-3 text-center">Total Unique Calls</th>
                        <th className="px-4 py-3 text-center">Connected</th>
                        <th className="px-4 py-3 text-center">Missed / Busy</th>
                        <th className="px-4 py-3 text-center">Success Rate</th>
                        <th className="px-4 py-3 text-right">Last Interaction</th>
                        <th className="px-4 py-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.counsellorDailyStats.map((c) => {
                        const successRate = c.total_calls > 0
                          ? Math.round((c.connected_calls / c.total_calls) * 100)
                          : 0;
                        const isFiltered = selectedCounsellor === c.counsellor_name;

                        return (
                          <tr
                            key={c.counsellor_name}
                            className={`hover:bg-slate-50/70 transition-colors ${
                              isFiltered ? "bg-rose-50/30" : ""
                            }`}
                          >
                            <td className="px-4 py-3 font-semibold text-slate-900 flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-full bg-rose-50 text-[#8B1E1E] border border-rose-200 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                {c.counsellor_name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold">{c.counsellor_name}</div>
                                {isFiltered && (
                                  <span className="text-[10px] text-[#8B1E1E] font-medium">Filtered</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-block px-2.5 py-0.5 font-bold rounded-full bg-rose-50 text-[#8B1E1E] text-xs">
                                {c.today_calls}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-block px-2.5 py-0.5 font-bold rounded-full bg-blue-50 text-blue-700 text-xs">
                                {c.today_unique_calls || 0}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center text-slate-700 font-medium">
                              <div>{c.week_calls}</div>
                              <div className="text-[10px] text-slate-400">({c.week_unique_calls || 0} unique)</div>
                            </td>
                            <td className="px-4 py-3 text-center text-slate-700 font-medium">
                              <div>{c.month_calls}</div>
                              <div className="text-[10px] text-slate-400">({c.month_unique_calls || 0} unique)</div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold bg-purple-50 text-purple-700 border border-purple-200 text-xs">
                                {c.unique_calls || 0}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-emerald-700 font-semibold">{c.connected_calls}</span>
                            </td>
                            <td className="px-4 py-3 text-center text-amber-700 font-medium">
                              {c.missed_busy}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                                  successRate >= 50
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {successRate}%
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-xs text-slate-500 whitespace-nowrap">
                              {c.last_call_at ? formatRelativeTime(c.last_call_at) : "—"}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => {
                                  setSelectedCounsellor(
                                    selectedCounsellor === c.counsellor_name ? "ALL" : c.counsellor_name
                                  );
                                  setActiveTab("logs");
                                }}
                                className="text-xs text-[#8B1E1E] font-semibold hover:underline"
                              >
                                {selectedCounsellor === c.counsellor_name ? "Show All" : "View Logs"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Call Disposition Breakdown & Reconciliation */}
          {data.dispositionBreakdown && data.dispositionBreakdown.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#8B1E1E]" />
                    Call Disposition Reconciliation ({dateRange === "today" ? "Today" : dateRange.replace("_", " ").toUpperCase()})
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Exact reconciliation of total calls and unique leads contacted across each recorded call disposition
                  </p>
                </div>
                {selectedDisposition !== "ALL" && (
                  <button
                    onClick={() => setSelectedDisposition("ALL")}
                    className="self-start sm:self-auto text-xs text-[#8B1E1E] font-semibold hover:underline flex items-center gap-1"
                  >
                    <span>Clear Filter ({selectedDisposition})</span>
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {data.dispositionBreakdown.map((item) => {
                  const meta = getOutcomeCategory(item.disposition);
                  const Icon = meta.icon;
                  const isSelected = selectedDisposition === item.disposition;
                  const totalPeriodCalls = data.logs.length;
                  const percent = totalPeriodCalls > 0 ? Math.round((item.total_calls / totalPeriodCalls) * 100) : 0;

                  return (
                    <button
                      key={item.disposition}
                      onClick={() => {
                        setSelectedDisposition(isSelected ? "ALL" : item.disposition);
                      }}
                      className={`text-left p-3.5 rounded-xl border transition-all ${
                        isSelected
                          ? "bg-rose-50/70 border-[#8B1E1E] ring-1 ring-[#8B1E1E]"
                          : "bg-slate-50/60 border-slate-200/80 hover:bg-slate-100/60 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-semibold ${meta.badgeClass}`}>
                          <Icon className="h-3 w-3" />
                          {item.disposition}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500">
                          {percent}%
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between mt-1">
                        <div>
                          <div className="text-lg font-bold text-slate-900 leading-none">
                            {item.total_calls}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">Total Calls</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-purple-700 leading-none">
                            {item.unique_leads}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">Unique Leads</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Detailed Call Logs in Overview tab as well */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {isCounsellor ? "Recent Call Logs" : "Detailed Call Activity"}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Showing recorded call outcomes, notes, and dispositions
                </p>
              </div>
              <button
                onClick={() => setActiveTab("logs")}
                className="text-xs font-semibold text-[#8B1E1E] hover:underline flex items-center gap-1"
              >
                <span>View Full History ({data.logs.length})</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            {loading ? (
              <div className="py-10 flex justify-center text-slate-400">
                <RefreshCw className="h-6 w-6 animate-spin text-[#8B1E1E]" />
              </div>
            ) : data.logs.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Phone className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">No call records found matching current filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold">
                    <tr>
                      <th className="px-4 py-3 text-left">Call Time</th>
                      {!isCounsellor && <th className="px-4 py-3 text-left">Counsellor</th>}
                      <th className="px-4 py-3 text-left">Candidate Name</th>
                      <th className="px-4 py-3 text-left">Phone Number</th>
                      <th className="px-4 py-3 text-left">Channel</th>
                      <th className="px-4 py-3 text-left">Outcome / Disposition</th>
                      <th className="px-4 py-3 text-left">Lead Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.logs.slice(0, 15).map((log) => {
                      const outcomeMeta = getOutcomeCategory(log.disposition);
                      const Icon = outcomeMeta.icon;

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                            <div>{log.call_time_ist ? log.call_time_ist.split(" ")[1] : formatDate(log.created_at)}</div>
                            <div className="text-[10px] text-slate-400">{formatRelativeTime(log.created_at)}</div>
                          </td>
                          {!isCounsellor && (
                            <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                              {log.counsellor_name}
                            </td>
                          )}
                          <td className="px-4 py-3 font-medium text-slate-800">
                            <div>{log.lead_name || "Unknown Candidate"}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{log.lead_id}</div>
                          </td>
                          <td className="px-4 py-3 text-slate-600 font-mono text-xs whitespace-nowrap">
                            {log.lead_phone || "—"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {log.call_type === "Phone Call" ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                                <Phone className="h-3 w-3" /> Voice Call
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                                <Mail className="h-3 w-3" /> {log.call_type || "Outreach"}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs max-w-xs">
                            <div className="flex items-center gap-1.5 font-medium text-slate-900">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-semibold ${outcomeMeta.badgeClass}`}>
                                <Icon className="h-3 w-3" />
                                {log.disposition || outcomeMeta.label}
                              </span>
                            </div>
                            {log.notes && log.notes !== log.disposition && (
                              <div className="text-slate-500 text-[11px] truncate mt-1">
                                {log.notes}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                              {log.lead_status || "New Lead"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: DATE-WISE ACTIVITY SUMMARY ────────────────────────────── */}
      {activeTab === "datewise" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#8B1E1E]" />
                Date-wise Calling Breakdown
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Daily aggregates showing total volume, connected outcomes, and unanswered calls
              </p>
            </div>
            <span className="text-xs text-slate-400 font-medium">Timezone: IST (UTC+05:30)</span>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center text-slate-400">
              <RefreshCw className="h-6 w-6 animate-spin text-[#8B1E1E]" />
            </div>
          ) : data.dateWiseStats.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">No date-wise call data recorded for this selection.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold">
                  <tr>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-center">Total Calls</th>
                    <th className="px-4 py-3 text-center">Unique Numbers</th>
                    <th className="px-4 py-3 text-center">Phone Calls</th>
                    <th className="px-4 py-3 text-center">Connected Calls</th>
                    <th className="px-4 py-3 text-center">Unanswered / Missed</th>
                    <th className="px-4 py-3 text-center">Connection Rate</th>
                    <th className="px-4 py-3 text-right">Talk Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.dateWiseStats.map((d) => {
                    const rate = d.total_calls > 0 ? Math.round((d.connected_calls / d.total_calls) * 100) : 0;
                    return (
                      <tr key={d.call_date} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {d.call_date}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-block px-2.5 py-0.5 font-bold rounded-full bg-rose-50 text-[#8B1E1E] text-xs">
                            {d.total_calls}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-block px-2.5 py-0.5 font-bold rounded-full bg-purple-50 text-purple-700 text-xs">
                            {d.unique_calls || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-slate-700 font-medium">
                          {d.phone_calls}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-emerald-700 font-semibold">{d.connected_calls}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-amber-700 font-medium">{d.unanswered_calls}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                              rate >= 50
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {rate}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs text-slate-600">
                          {formatDuration(d.total_duration)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: FULL CALL HISTORY ─────────────────────────────────────── */}
      {activeTab === "logs" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Detailed Call History & Outcome Logs
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Showing {data.logs.length} records matching applied filters
              </p>
            </div>
            <button
              onClick={handleExportCSV}
              disabled={data.logs.length === 0}
              className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50"
            >
              <Download className="h-3 w-3" /> Export CSV
            </button>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center text-slate-400">
              <RefreshCw className="h-6 w-6 animate-spin text-[#8B1E1E]" />
            </div>
          ) : data.logs.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Phone className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">No interaction logs match your search and filter criteria.</p>
              <button
                onClick={() => {
                  setDateRange("all");
                  setSelectedCounsellor("ALL");
                  setSelectedOutcome("ALL");
                  setSelectedType("ALL");
                  setSearch("");
                }}
                className="mt-3 text-xs text-[#8B1E1E] font-semibold underline hover:no-underline"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold">
                  <tr>
                    <th className="px-4 py-3 text-left">Date & Time (IST)</th>
                    {!isCounsellor && <th className="px-4 py-3 text-left">Counsellor</th>}
                    <th className="px-4 py-3 text-left">Candidate Name</th>
                    <th className="px-4 py-3 text-left">Phone Number</th>
                    <th className="px-4 py-3 text-left">Channel</th>
                    <th className="px-4 py-3 text-left">Call Outcome / Disposition</th>
                    <th className="px-4 py-3 text-left">Duration</th>
                    <th className="px-4 py-3 text-left">Notes</th>
                    <th className="px-4 py-3 text-left">Lead Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.logs.map((log) => {
                    const outcomeMeta = getOutcomeCategory(log.disposition);
                    const Icon = outcomeMeta.icon;

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                          <div className="font-medium text-slate-900">
                            {log.call_time_ist ? log.call_time_ist : formatDate(log.created_at)}
                          </div>
                          <div className="text-[10px] text-slate-400">{formatRelativeTime(log.created_at)}</div>
                        </td>
                        {!isCounsellor && (
                          <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                            {log.counsellor_name}
                          </td>
                        )}
                        <td className="px-4 py-3 font-medium text-slate-800">
                          <div>{log.lead_name || "Unknown"}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{log.lead_id}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-mono text-xs whitespace-nowrap">
                          {log.lead_phone || "—"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {log.call_type === "Phone Call" ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                              <Phone className="h-3 w-3" /> Call
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                              <Mail className="h-3 w-3" /> {log.call_type || "Outreach"}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border text-xs font-semibold ${outcomeMeta.badgeClass}`}>
                            <Icon className="h-3.5 w-3.5" />
                            {log.disposition || outcomeMeta.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-slate-600 whitespace-nowrap">
                          {formatDuration(log.duration)}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 max-w-xs">
                          <div className="truncate" title={log.notes || "—"}>
                            {log.notes || "—"}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            {log.lead_status || "New Lead"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
