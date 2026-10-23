"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Phone,
  PhoneCall,
  MessageSquare,
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
} from "lucide-react";
import { SectionShell, EmptyState, AdminTable, LoadingSkeleton } from "@/features/admin/components/ui";
import { formatDate, formatRelativeTime } from "@/lib/utils";

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    logs: [],
    counsellorDailyStats: [],
    todaySummary: { total_today: 0, phone_today: 0, whatsapp_today: 0, email_today: 0 },
    counsellors: [],
  });

  const [dateRange, setDateRange] = useState("today"); // today, yesterday, week, month, all
  const [selectedCounsellor, setSelectedCounsellor] = useState("ALL");
  const [selectedType, setSelectedType] = useState("ALL");
  const [search, setSearch] = useState("");

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        dateRange,
        counsellor: selectedCounsellor,
        type: selectedType,
        search,
      });
      const res = await fetch(`/api/admin/reports?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (e) {
      console.error("Error loading reports:", e);
    } finally {
      setLoading(false);
    }
  }, [dateRange, selectedCounsellor, selectedType, search]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Export logs to CSV
  const handleExportCSV = () => {
    if (!data.logs || data.logs.length === 0) return;
    const headers = ["ID", "Lead ID", "Student Name", "Phone", "Counsellor", "Type", "Outcome / Disposition", "Notes", "Date & Time"];
    const rows = data.logs.map((l) => [
      l.id,
      l.lead_id,
      `"${(l.lead_name || "").replace(/"/g, '""')}"`,
      l.lead_phone || "",
      `"${(l.counsellor_name || "").replace(/"/g, '""')}"`,
      l.call_type || "",
      `"${(l.disposition || "").replace(/"/g, '""')}"`,
      `"${(l.notes || "").replace(/"/g, '""')}"`,
      l.created_at ? new Date(l.created_at).toLocaleString() : "",
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `call_logs_report_${dateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports & Call Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track daily calls, outreach activity, and counsellor performance logs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchReports}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button
            onClick={handleExportCSV}
            disabled={!data.logs || data.logs.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#8B1E1E] text-white text-xs font-semibold hover:bg-[#6d1414] transition-colors shadow-sm disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" /> Export Logs
          </button>
        </div>
      </div>

      {/* Top Today Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-sm transition-all">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl border flex items-center justify-center flex-shrink-0 bg-rose-50 text-[#8B1E1E] border-rose-100">
              <PhoneCall className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{data.todaySummary.total_today}</p>
              <p className="text-sm font-medium text-slate-600">Total Calls Today</p>
              <p className="text-[11px] text-slate-400 mt-0.5">All counsellor outreach</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-sm transition-all">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl border flex items-center justify-center flex-shrink-0 bg-blue-50 text-blue-700 border-blue-100">
              <Phone className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{data.todaySummary.phone_today}</p>
              <p className="text-sm font-medium text-slate-600">Phone Calls</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Voice conversations logged</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-sm transition-all">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl border flex items-center justify-center flex-shrink-0 bg-emerald-50 text-emerald-700 border-emerald-100">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{data.todaySummary.whatsapp_today}</p>
              <p className="text-sm font-medium text-slate-600">WhatsApp Chats</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Candidate messages sent</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-sm transition-all">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl border flex items-center justify-center flex-shrink-0 bg-purple-50 text-purple-700 border-purple-100">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{data.counsellorDailyStats.length}</p>
              <p className="text-sm font-medium text-slate-600">Active Counsellors</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Logged calls today</p>
            </div>
          </div>
        </div>
      </div>

      {/* Counsellor Daily Performance Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#8B1E1E]" />
              Today's Counsellor Calling Activity
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live breakdown of calls made by each counsellor today
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-rose-50 text-[#8B1E1E] border border-rose-100">
            Today
          </span>
        </div>

        {data.counsellorDailyStats.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            <PhoneCall className="h-8 w-8 mx-auto mb-2 opacity-30 text-slate-400" />
            No calls or outreach logged by counsellors today yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold">
                <tr>
                  <th className="px-4 py-3 text-left">Counsellor Name</th>
                  <th className="px-4 py-3 text-center">Total Calls</th>
                  <th className="px-4 py-3 text-center">Phone Calls</th>
                  <th className="px-4 py-3 text-center">WhatsApp</th>
                  <th className="px-4 py-3 text-center">Connected</th>
                  <th className="px-4 py-3 text-center">Ringing / Busy</th>
                  <th className="px-4 py-3 text-right">Last Interaction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.counsellorDailyStats.map((c) => (
                  <tr key={c.counsellor_name} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900 flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-full bg-rose-50 text-[#8B1E1E] border border-rose-200 flex items-center justify-center text-xs font-bold">
                        {c.counsellor_name.slice(0, 2).toUpperCase()}
                      </div>
                      <span>{c.counsellor_name}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block px-2.5 py-0.5 font-bold rounded-full bg-rose-50 text-[#8B1E1E] text-xs">
                        {c.total_calls}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-700 font-medium">{c.phone_calls}</td>
                    <td className="px-4 py-3 text-center text-slate-700 font-medium">{c.whatsapp_chats}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-emerald-700 font-semibold">{c.connected_calls}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-500">{c.missed_busy}</td>
                    <td className="px-4 py-3 text-right text-xs text-slate-500">
                      {c.last_call_at ? formatRelativeTime(c.last_call_at) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detailed Interaction Call Logs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6">
        <div className="mb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Call History & Interaction Logs</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Detailed records of conversations, dispositions, and notes
            </p>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search lead or phone…"
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs w-44 sm:w-56 focus:outline-none focus:ring-1 focus:ring-[#8B1E1E]"
              />
            </div>

            {/* Date Range Selector */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="h-8 rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#8B1E1E]"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>

            {/* Counsellor Filter */}
            <select
              value={selectedCounsellor}
              onChange={(e) => setSelectedCounsellor(e.target.value)}
              className="h-8 rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#8B1E1E]"
            >
              <option value="ALL">All Counsellors</option>
              {data.counsellors.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="h-8 rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#8B1E1E]"
            >
              <option value="ALL">All Types</option>
              <option value="Phone Call">Phone Calls</option>
              <option value="WhatsApp Chat">WhatsApp</option>
              <option value="Email Follow-up">Email</option>
            </select>
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton rows={4} />
        ) : data.logs.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Phone className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium">No call logs matching the selected filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold">
                <tr>
                  <th className="px-4 py-3 text-left">Date & Time</th>
                  <th className="px-4 py-3 text-left">Counsellor</th>
                  <th className="px-4 py-3 text-left">Candidate Name</th>
                  <th className="px-4 py-3 text-left">Phone Number</th>
                  <th className="px-4 py-3 text-left">Channel</th>
                  <th className="px-4 py-3 text-left">Call Disposition / Outcome</th>
                  <th className="px-4 py-3 text-left">Lead Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                      {log.counsellor_name}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      <div>{log.lead_name || "Unknown"}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{log.lead_id}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-mono text-xs whitespace-nowrap">
                      {log.lead_phone || "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {log.call_type === "Phone Call" && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                          <Phone className="h-3 w-3" /> Call
                        </span>
                      )}
                      {log.call_type === "WhatsApp Chat" && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                          <MessageSquare className="h-3 w-3" /> WhatsApp
                        </span>
                      )}
                      {log.call_type === "Email Follow-up" && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                          <Mail className="h-3 w-3" /> Email
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700 max-w-xs">
                      <div className="font-medium text-slate-900 truncate">{log.disposition || "—"}</div>
                      {log.notes && log.notes !== log.disposition && (
                        <div className="text-slate-500 text-[11px] truncate mt-0.5">{log.notes}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {log.lead_status || "New Lead"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
