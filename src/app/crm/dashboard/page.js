"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  Users,
  CheckCircle2,
  Clock,
  Flame,
  DollarSign,
  GraduationCap,
  RefreshCw,
  ArrowUpRight,
  Calendar,
  Target,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getRoleLabel } from "@/lib/auth";
import { LEAD_STATUSES } from "@/lib/constants";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function MetricCard({ icon: Icon, label, value, subtitle, color, onClick, active }) {
  const colors = {
    rose: {
      bg: "bg-rose-50",
      icon: "text-[#8B1E1E]",
      border: active ? "border-[#8B1E1E]/30 shadow-rose-100/50" : "border-rose-100",
      ring: "ring-[#8B1E1E]/20",
    },
    blue: {
      bg: "bg-blue-50",
      icon: "text-blue-600",
      border: active ? "border-blue-400/30 shadow-blue-100/50" : "border-blue-100",
      ring: "ring-blue-400/20",
    },
    amber: {
      bg: "bg-amber-50",
      icon: "text-amber-600",
      border: active ? "border-amber-400/30 shadow-amber-100/50" : "border-amber-100",
      ring: "ring-amber-400/20",
    },
    purple: {
      bg: "bg-purple-50",
      icon: "text-purple-600",
      border: active ? "border-purple-400/30 shadow-purple-100/50" : "border-purple-100",
      ring: "ring-purple-400/20",
    },
    teal: {
      bg: "bg-teal-50",
      icon: "text-teal-600",
      border: active ? "border-teal-400/30 shadow-teal-100/50" : "border-teal-100",
      ring: "ring-teal-400/20",
    },
    emerald: {
      bg: "bg-emerald-50",
      icon: "text-emerald-600",
      border: active ? "border-emerald-400/30 shadow-emerald-100/50" : "border-emerald-100",
      ring: "ring-emerald-400/20",
    },
  };
  const c = colors[color] || colors.rose;
  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-white rounded-2xl border p-5 hover:shadow-md transition-all group ${
        active ? `${c.border} shadow-sm ring-2 ${c.ring}` : `${c.border} hover:border-slate-300`
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className={`h-10 w-10 rounded-xl ${c.bg} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`h-5 w-5 ${c.icon}`} />
        </div>
        <ArrowUpRight className="h-4 w-4 text-slate-300 group-hover:text-slate-400 transition-colors mt-1" />
      </div>
      <p className="text-2xl font-bold text-slate-900 leading-none">{value}</p>
      <p className="text-sm font-medium text-slate-600 mt-1">{label}</p>
      {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
    </button>
  );
}

function StatusRow({ label, value, total, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 text-xs text-slate-600 font-medium leading-tight">{label}</div>
      <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="w-8 text-xs font-semibold text-slate-700 text-right">{value}</div>
      <div className="w-10 text-xs text-slate-400 text-right">{pct}%</div>
    </div>
  );
}

function SkeletonCard() {
  return <div className="h-32 rounded-2xl bg-slate-100 animate-pulse" />;
}

// ─── Main Dashboard Page ─────────────────────────────────────────────────────

export default function CRMDashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load session
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        if (data.authenticated) {
          setSession(data.session);
        } else {
          try {
            const stored = localStorage.getItem("crm_lms_user_v1");
            if (stored) setSession(JSON.parse(stored));
          } catch {}
        }
      } catch {
        try {
          const stored = localStorage.getItem("crm_lms_user_v1");
          if (stored) setSession(JSON.parse(stored));
        } catch {}
      }
    };
    load();
  }, []);

  // Fetch dashboard stats scoped to the user's role
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/crm/dashboard");
      const data = await res.json();
      if (data.success) setStats(data.stats);
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-64 rounded-xl bg-slate-100 animate-pulse mb-2" />
        <div className="h-4 w-40 rounded-lg bg-slate-100 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  const s = stats || {};

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {session?.name
              ? `Good ${getGreeting()}, ${session.name.split(" ")[0]}! 👋`
              : "Dashboard"}
          </h1>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {today}
            {session?.role && (
              <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 border border-rose-200 text-[#8B1E1E]">
                {getRoleLabel(session.role)}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Scope Banner */}
      {session?.role === "UnitHead" && (
        <div className="bg-purple-50 border border-purple-200 rounded-2xl px-5 py-3.5 flex items-center gap-3">
          <Users className="h-5 w-5 text-purple-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-purple-900">Unit-Scoped View</p>
            <p className="text-xs text-purple-700">
              Showing leads for counsellors under your unit.
            </p>
          </div>
        </div>
      )}
      {session?.role === "Counsellor" && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-3.5 flex items-center gap-3">
          <Target className="h-5 w-5 text-blue-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-900">Personal View</p>
            <p className="text-xs text-blue-700">
              Showing only leads assigned to you.
            </p>
          </div>
        </div>
      )}

      {/* Primary Metric Cards */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Overview
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            icon={TrendingUp}
            label="Total Leads"
            value={s.total ?? "—"}
            subtitle="All time in scope"
            color="rose"
            onClick={() => router.push("/crm/leads")}
          />
          <MetricCard
            icon={Calendar}
            label="Today's Leads"
            value={s.todayLeads ?? "—"}
            subtitle="Punched today"
            color="blue"
            onClick={() => router.push("/crm/leads")}
          />
          <MetricCard
            icon={Flame}
            label="Hot Leads"
            value={s.hotLeads ?? "—"}
            subtitle="High intent"
            color="amber"
            onClick={() => router.push("/crm/leads")}
          />
          <MetricCard
            icon={CheckCircle2}
            label="Admissions"
            value={s.admissionApproved ?? "—"}
            subtitle={`${s.conversionRate ?? 0}% conversion`}
            color="emerald"
            onClick={() => router.push("/crm/leads")}
          />
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          icon={Clock}
          label="New Leads"
          value={s.newLeads ?? "—"}
          subtitle="Awaiting contact"
          color="blue"
          onClick={() => router.push("/crm/leads")}
        />
        <MetricCard
          icon={DollarSign}
          label="Reg. Paid"
          value={s.registrationPaid ?? "—"}
          subtitle="Registration fee paid"
          color="purple"
          onClick={() => router.push("/crm/leads")}
        />
        <MetricCard
          icon={GraduationCap}
          label="Fees Collected"
          value={s.feesPaid ?? "—"}
          subtitle="Full fees received"
          color="teal"
          onClick={() => router.push("/crm/leads")}
        />
      </div>

      {/* Status Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-slate-900">Lead Status Breakdown</h2>
          <button
            onClick={() => router.push("/crm/leads")}
            className="text-xs font-semibold text-[#8B1E1E] hover:text-[#6d1414] transition-colors flex items-center gap-1"
          >
            View All <ArrowUpRight className="h-3 w-3" />
          </button>
        </div>
        <div className="space-y-3.5">
          <StatusRow label="New Lead" value={s.newLeads ?? 0} total={s.total ?? 1} color="bg-blue-500" />
          <StatusRow label="Hot" value={s.hotLeads ?? 0} total={s.total ?? 1} color="bg-rose-500" />
          <StatusRow label="Warm" value={s.warmLeads ?? 0} total={s.total ?? 1} color="bg-amber-500" />
          <StatusRow label="Cold" value={s.coldLeads ?? 0} total={s.total ?? 1} color="bg-slate-400" />
          <StatusRow label="Reg. Paid" value={s.registrationPaid ?? 0} total={s.total ?? 1} color="bg-purple-500" />
          <StatusRow label="Fees Collected" value={s.feesPaid ?? 0} total={s.total ?? 1} color="bg-teal-500" />
          <StatusRow label="Admitted" value={s.admissionApproved ?? 0} total={s.total ?? 1} color="bg-emerald-500" />
          <StatusRow label="Dropped / Lost" value={s.dropped ?? 0} total={s.total ?? 1} color="bg-gray-400" />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-base font-bold text-slate-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => router.push("/crm/leads")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#8B1E1E] text-white text-sm font-semibold hover:bg-[#6d1414] transition-colors shadow-sm"
          >
            <TrendingUp className="h-4 w-4" />
            View All Leads
          </button>
          <button
            onClick={() => router.push("/crm/leads")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Clock className="h-4 w-4" />
            New Leads ({s.newLeads ?? 0})
          </button>
          {session?.role !== "Counsellor" && (
            <button
              onClick={() => router.push("/crm/counsellors")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Users className="h-4 w-4" />
              Manage Counsellors
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}
