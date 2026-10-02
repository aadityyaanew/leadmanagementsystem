"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Landmark, GraduationCap, Building2, RefreshCw, Shield } from "lucide-react";

function StatsCard({ icon: Icon, label, value, color, subtitle }) {
  const colors = {
    rose:    "bg-rose-50 text-[#8B1E1E] border-rose-100",
    blue:    "bg-blue-50 text-blue-700 border-blue-100",
    purple:  "bg-purple-50 text-purple-700 border-purple-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-all">
      <div className="flex items-center gap-4">
        <div className={`h-12 w-12 rounded-xl border flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          <p className="text-sm font-medium text-slate-600">{label}</p>
          {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState({ users: 0, colleges: 0, courses: 0, units: 0 });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const [u, c, co, un] = await Promise.all([
        fetch("/api/admin/users").then(r => r.json()),
        fetch("/api/admin/colleges").then(r => r.json()),
        fetch("/api/admin/courses").then(r => r.json()),
        fetch("/api/admin/units").then(r => r.json()),
      ]);
      setStats({
        users:    u.success   ? u.users.length    : 0,
        colleges: c.success   ? c.colleges.length : 0,
        courses:  co.success  ? co.courses.length : 0,
        units:    un.success  ? un.units.length   : 0,
      });
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">System overview and configuration</p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard icon={Users}        label="Total Users"  value={stats.users}    color="rose"    subtitle="Business Mgr, Unit Heads, Counsellors" />
        <StatsCard icon={Landmark}     label="Colleges"     value={stats.colleges} color="blue"    subtitle="Partner institutions" />
        <StatsCard icon={GraduationCap} label="Courses"     value={stats.courses}  color="purple"  subtitle="Available programs" />
        <StatsCard icon={Building2}    label="Units"        value={stats.units}    color="emerald" subtitle="Sales & admission centers" />
      </div>

      <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-xl bg-[#8B1E1E]/10 border border-rose-200 flex items-center justify-center flex-shrink-0">
            <Shield className="h-5 w-5 text-[#8B1E1E]" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-1">Admin Capabilities</h3>
            <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
              <li>Add, edit and deactivate <strong>Business Managers</strong>, <strong>Unit Heads</strong> and <strong>Counsellors</strong></li>
              <li>Manage <strong>Colleges</strong> that appear in lead intake forms</li>
              <li>Configure <strong>Courses</strong> offered per college</li>
              <li>Create and assign <strong>Units</strong> (sales/admission centers) with unit heads</li>
              <li>All changes reflect live in the CRM lead management forms</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
