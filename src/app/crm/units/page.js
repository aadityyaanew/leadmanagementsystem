"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Building2,
  Users,
  MapPin,
  TrendingUp,
  CheckCircle,
  XCircle,
  Search,
  RefreshCw,
  UserCog,
  ChevronRight,
  BarChart2,
} from "lucide-react";
import { getRoleLabel } from "@/lib/auth";

// ─── Toast ────────────────────────────────────────────────────────────────────

function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);
  return { toasts, add };
}

function Toast({ toasts }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-medium border animate-toast-in ${
            t.type === "error" ? "bg-red-50 text-red-700 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
          }`}
        >
          {t.type === "error" ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ─── Unit Card ────────────────────────────────────────────────────────────────

function UnitCard({ unit, counsellors, stats }) {
  const unitCounsellors = counsellors.filter(
    (c) => String(c.unit_id) === String(unit.id) && c.role === "Counsellor"
  );
  const s = stats || {};
  const convRate = s.total > 0 ? ((s.admitted / s.total) * 100).toFixed(1) : "0.0";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center flex-shrink-0">
            <Building2 className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-sm">{unit.name}</p>
            {unit.location && (
              <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" />{unit.location}
              </p>
            )}
          </div>
        </div>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
            unit.is_active
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-slate-100 text-slate-700 border-slate-200"
          }`}
        >
          {unit.is_active ? (
            <><CheckCircle className="h-3 w-3 mr-1" />Active</>
          ) : (
            <><XCircle className="h-3 w-3 mr-1" />Inactive</>
          )}
        </span>
      </div>

      {/* Unit Head */}
      {unit.head_name && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-purple-50/50 rounded-xl border border-purple-100">
          <UserCog className="h-3.5 w-3.5 text-purple-500 flex-shrink-0" />
          <span className="text-[11px] text-purple-700 font-medium">Head: {unit.head_name}</span>
        </div>
      )}

      {/* Lead Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
          <p className="text-lg font-bold text-slate-900">{s.total ?? "—"}</p>
          <p className="text-[10px] text-slate-500 font-medium">Leads</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-2.5 text-center border border-emerald-100">
          <p className="text-lg font-bold text-emerald-700">{s.admitted ?? "—"}</p>
          <p className="text-[10px] text-emerald-600 font-medium">Admitted</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-2.5 text-center border border-blue-100">
          <p className="text-lg font-bold text-blue-700">{unitCounsellors.length}</p>
          <p className="text-[10px] text-blue-600 font-medium">Counsellors</p>
        </div>
      </div>

      {/* Conversion rate */}
      {s.total > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
            <span>Conversion Rate</span>
            <span className="font-semibold text-slate-700">{convRate}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${Math.min(100, parseFloat(convRate))}%` }}
            />
          </div>
        </div>
      )}

      {/* Counsellors list */}
      {unitCounsellors.length > 0 && (
        <div className="pt-3 border-t border-slate-100">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Counsellors ({unitCounsellors.length})
          </p>
          <div className="space-y-1.5">
            {unitCounsellors.slice(0, 3).map((c) => (
              <div key={c.id} className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-[10px] font-bold text-[#8B1E1E] flex-shrink-0">
                  {(c.name || "").slice(0, 2).toUpperCase()}
                </div>
                <span className="text-xs text-slate-700 font-medium truncate">{c.name}</span>
                {c.is_active ? (
                  <span className="ml-auto text-[10px] text-emerald-600 font-medium">Active</span>
                ) : (
                  <span className="ml-auto text-[10px] text-slate-400 font-medium">Inactive</span>
                )}
              </div>
            ))}
            {unitCounsellors.length > 3 && (
              <p className="text-[10px] text-slate-400 pl-8">
                +{unitCounsellors.length - 3} more
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CRMUnitsPage() {
  const [session, setSession] = useState(null);
  const [units, setUnits] = useState([]);
  const [counsellors, setCounsellors] = useState([]);
  const [unitStats, setUnitStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toasts, add: toast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        if (data.authenticated) setSession(data.session);
        else {
          try {
            const stored = localStorage.getItem("crm_lms_user_v1");
            if (stored) setSession(JSON.parse(stored));
          } catch {}
        }
      } catch {}
    };
    load();
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [unitsRes, usersRes, statsRes] = await Promise.all([
        fetch("/api/admin/units"),
        fetch("/api/admin/users"),
        fetch("/api/crm/unit-stats"),
      ]);
      const [unitsData, usersData, statsData] = await Promise.all([
        unitsRes.json(),
        usersRes.json(),
        statsRes.json(),
      ]);
      if (unitsData.success) setUnits(unitsData.units);
      if (usersData.success) setCounsellors(usersData.users);
      if (statsData.success) setUnitStats(statsData.stats);
    } catch {
      toast("Failed to load units", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = units.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      (u.location || "").toLowerCase().includes(q) ||
      (u.head_name || "").toLowerCase().includes(q)
    );
  });

  const totalLeads = Object.values(unitStats).reduce((sum, s) => sum + (s.total || 0), 0);
  const totalAdmitted = Object.values(unitStats).reduce((sum, s) => sum + (s.admitted || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Units</h1>
          <p className="text-sm text-slate-500 mt-1">
            Sales and admission centers with their counsellors and performance
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-2xl font-bold text-slate-900">{units.length}</p>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Total Units</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-2xl font-bold text-slate-900">
            {units.filter((u) => u.is_active).length}
          </p>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Active Units</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-2xl font-bold text-slate-900">{totalLeads}</p>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Total Leads</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-2xl font-bold text-emerald-700">{totalAdmitted}</p>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Total Admissions</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search units by name, location, head…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1E1E]/30 focus:border-[#8B1E1E] transition-all"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-72 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Building2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium text-slate-500">No units found</p>
          <p className="text-sm mt-1">
            {search ? "Try adjusting your search" : "No units configured yet. Add them from Admin Panel."}
          </p>
          {session?.role === "Admin" && (
            <a
              href="/admin/dashboard"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-[#8B1E1E] text-white text-sm font-semibold hover:bg-[#6d1414] transition-colors"
            >
              Go to Admin Panel <ChevronRight className="h-4 w-4" />
            </a>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((unit) => (
            <UnitCard
              key={unit.id}
              unit={unit}
              counsellors={counsellors}
              stats={unitStats[unit.id]}
            />
          ))}
        </div>
      )}

      <Toast toasts={toasts} />
    </div>
  );
}
