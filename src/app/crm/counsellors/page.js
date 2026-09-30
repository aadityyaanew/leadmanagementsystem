"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Plus,
  Pencil,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  TrendingUp,
  Building2,
  Phone,
  Mail,
  UserCog,
  ChevronDown,
} from "lucide-react";
import { getRoleLabel, getRoleBadgeClass } from "@/lib/auth";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Avatar({ name = "", className = "" }) {
  const parts = name.trim().split(" ");
  const initials =
    parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  return (
    <span
      className={`inline-flex items-center justify-center rounded-xl bg-rose-50 text-[#8B1E1E] font-bold border border-rose-200/60 text-xs flex-shrink-0 ${className}`}
    >
      {initials}
    </span>
  );
}

function Badge({ children, color = "slate" }) {
  const map = {
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${map[color] || map.slate}`}>
      {children}
    </span>
  );
}

function Toast({ toasts }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-medium border animate-toast-in ${
            t.type === "error"
              ? "bg-red-50 text-red-700 border-red-200"
              : "bg-emerald-50 text-emerald-700 border-emerald-200"
          }`}
        >
          {t.type === "error" ? (
            <XCircle className="h-4 w-4 flex-shrink-0" />
          ) : (
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
          )}
          {t.msg}
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);
  return { toasts, add };
}

// ─── Counsellor Stats Card ────────────────────────────────────────────────────

function CounsellorCard({ counsellor, onEdit, canEdit, stats }) {
  const s = stats || {};
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <Avatar name={counsellor.name} className="h-11 w-11 text-sm" />
          <div>
            <p className="font-semibold text-slate-900 text-sm leading-tight">{counsellor.name}</p>
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border mt-0.5 ${getRoleBadgeClass(counsellor.role)}`}
            >
              {getRoleLabel(counsellor.role)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {counsellor.is_active ? (
            <Badge color="emerald">
              <CheckCircle className="h-3 w-3 mr-1" />Active
            </Badge>
          ) : (
            <Badge color="slate">
              <XCircle className="h-3 w-3 mr-1" />Inactive
            </Badge>
          )}
        </div>
      </div>

      {/* Contact info */}
      <div className="space-y-1.5 mb-4">
        {counsellor.phone && (
          <div className="flex items-center gap-2 text-[12px] text-slate-600">
            <Phone className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            {counsellor.phone}
          </div>
        )}
        {counsellor.email && (
          <div className="flex items-center gap-2 text-[12px] text-slate-600">
            <Mail className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            <span className="truncate">{counsellor.email}</span>
          </div>
        )}
        {counsellor.unit_name && (
          <div className="flex items-center gap-2 text-[12px] text-slate-600">
            <Building2 className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            {counsellor.unit_name}
          </div>
        )}
        {counsellor.employee_id && (
          <div className="flex items-center gap-2 text-[12px] text-slate-500">
            <UserCog className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            ID: {counsellor.employee_id}
          </div>
        )}
      </div>

      {/* Lead stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
          <p className="text-lg font-bold text-slate-900">{s.total ?? "—"}</p>
          <p className="text-[10px] text-slate-500 font-medium">Total</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-2.5 text-center border border-emerald-100">
          <p className="text-lg font-bold text-emerald-700">{s.admitted ?? "—"}</p>
          <p className="text-[10px] text-emerald-600 font-medium">Admitted</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-2.5 text-center border border-amber-100">
          <p className="text-lg font-bold text-amber-700">{s.hot ?? "—"}</p>
          <p className="text-[10px] text-amber-600 font-medium">Hot</p>
        </div>
      </div>

      {/* Actions */}
      {canEdit && (
        <div className="pt-3 border-t border-slate-100">
          <button
            onClick={() => onEdit(counsellor)}
            className="w-full flex items-center gap-2 justify-center py-2 rounded-xl text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit Counsellor
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditModal({ open, counsellor, units, onClose, onSave, saving }) {
  const [form, setForm] = useState({
    unit_id: "",
    is_active: 1,
  });

  useEffect(() => {
    if (counsellor) {
      setForm({
        unit_id: counsellor.unit_id || "",
        is_active: counsellor.is_active ?? 1,
      });
    }
  }, [counsellor]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open || !counsellor) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Edit Counsellor</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <XCircle className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <Avatar name={counsellor.name} className="h-10 w-10" />
            <div>
              <p className="font-semibold text-slate-900 text-sm">{counsellor.name}</p>
              <p className="text-xs text-slate-500">{counsellor.employee_id}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Assign to Unit</label>
            <select
              value={form.unit_id}
              onChange={(e) => setForm((p) => ({ ...p, unit_id: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1E1E]/30 focus:border-[#8B1E1E] transition-all bg-white"
            >
              <option value="">No unit</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Status</label>
            <select
              value={form.is_active}
              onChange={(e) => setForm((p) => ({ ...p, is_active: Number(e.target.value) }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1E1E]/30 focus:border-[#8B1E1E] transition-all bg-white"
            >
              <option value={1}>Active</option>
              <option value={0}>Inactive</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(counsellor.id, form)}
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-[#8B1E1E] text-white text-sm font-semibold hover:bg-[#6d1414] transition-colors disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CounsellorManagementPage() {
  const [session, setSession] = useState(null);
  const [counsellors, setCounsellors] = useState([]);
  const [units, setUnits] = useState([]);
  const [counsellorStats, setCounsellorStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [unitFilter, setUnitFilter] = useState("ALL");
  const [editTarget, setEditTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const { toasts, add: toast } = useToast();

  // Load session
  useEffect(() => {
    const loadSession = async () => {
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
    loadSession();
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, unitsRes, statsRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/units"),
        fetch("/api/crm/counsellor-stats"),
      ]);
      const [usersData, unitsData, statsData] = await Promise.all([
        usersRes.json(),
        unitsRes.json(),
        statsRes.json(),
      ]);

      if (usersData.success) {
        // Filter to counsellors only
        setCounsellors(usersData.users.filter((u) => u.role === "Counsellor"));
      }
      if (unitsData.success) setUnits(unitsData.units);
      if (statsData.success) setCounsellorStats(statsData.stats);
    } catch {
      toast("Failed to load counsellors", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async (id, form) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...form }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast("Counsellor updated");
      setEditTarget(null);
      fetchData();
    } catch (e) {
      toast(e.message || "Failed to update", "error");
    } finally {
      setSaving(false);
    }
  };

  // Determine permission to edit based on session role
  const canEdit = session?.role === "Admin" || session?.role === "BusinessManager" || session?.role === "UnitHead";

  // Filter counsellors based on session role (unit head sees only their unit)
  const scopedCounsellors = (() => {
    if (!session) return counsellors;
    if (session.role === "UnitHead" && session.unit_id) {
      return counsellors.filter((c) => String(c.unit_id) === String(session.unit_id));
    }
    return counsellors;
  })();

  const filtered = scopedCounsellors.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      c.name.toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q) ||
      (c.phone || "").includes(q) ||
      (c.employee_id || "").toLowerCase().includes(q);
    const matchUnit = unitFilter === "ALL" || String(c.unit_id) === String(unitFilter);
    return matchSearch && matchUnit;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Counsellors</h1>
          <p className="text-sm text-slate-500 mt-1">
            {session?.role === "UnitHead"
              ? "Counsellors under your unit"
              : "All counsellors in the system"}
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone, ID…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1E1E]/30 focus:border-[#8B1E1E] transition-all"
          />
        </div>
        {(session?.role === "Admin" || session?.role === "BusinessManager") && (
          <select
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1E1E]/30 focus:border-[#8B1E1E] bg-white"
          >
            <option value="ALL">All Units</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
            <option value="">No Unit</option>
          </select>
        )}
      </div>

      {/* Stats summary */}
      <div className="flex items-center gap-4 mb-6 text-sm text-slate-600">
        <span className="flex items-center gap-1.5">
          <Users className="h-4 w-4 text-slate-400" />
          <strong className="text-slate-900">{filtered.length}</strong> counsellors
        </span>
        <span className="flex items-center gap-1.5">
          <CheckCircle className="h-4 w-4 text-emerald-500" />
          <strong className="text-slate-900">{filtered.filter((c) => c.is_active).length}</strong> active
        </span>
        <span className="flex items-center gap-1.5">
          <TrendingUp className="h-4 w-4 text-blue-500" />
          <strong className="text-slate-900">
            {Object.values(counsellorStats).reduce((sum, s) => sum + (s.total || 0), 0)}
          </strong> total leads
        </span>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-56 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium text-slate-500">No counsellors found</p>
          <p className="text-sm mt-1">
            {search ? "Try adjusting your search" : "No counsellors are currently assigned"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <CounsellorCard
              key={c.id}
              counsellor={c}
              onEdit={setEditTarget}
              canEdit={canEdit}
              stats={counsellorStats[c.name] || counsellorStats[c.id]}
            />
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <EditModal
        open={Boolean(editTarget)}
        counsellor={editTarget}
        units={units}
        onClose={() => setEditTarget(null)}
        onSave={handleSave}
        saving={saving}
      />

      <Toast toasts={toasts} />
    </div>
  );
}
