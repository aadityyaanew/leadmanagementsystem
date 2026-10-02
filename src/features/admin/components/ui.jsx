"use client";

import { cn } from "@/lib/utils";
import { Search, RefreshCw, Plus, CheckCircle, XCircle, MapPin } from "lucide-react";

// ─── SectionShell ───────────────────────────────────────────────────────────
// Shared wrapper used by every admin section page.
// Renders the page heading, search bar, action buttons, and loading skeletons.

export function SectionShell({
  title,
  description,
  search,
  onSearch,
  onRefresh,
  onAdd,
  addLabel = "Add",
  loading,
  children,
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Title */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {onSearch !== undefined && (
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder={`Search ${title.toLowerCase()}…`}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1E1E]/30 focus:border-[#8B1E1E] transition-all bg-white"
            />
          </div>
        )}
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        )}
        {onAdd && (
          <button
            onClick={onAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#8B1E1E] text-white text-sm font-semibold hover:bg-[#6d1414] transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" /> {addLabel}
          </button>
        )}
      </div>

      {/* Body */}
      {loading ? <LoadingSkeleton /> : children}
    </div>
  );
}

// ─── LoadingSkeleton ─────────────────────────────────────────────────────────

export function LoadingSkeleton({ rows = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />
      ))}
    </div>
  );
}

// ─── EmptyState ──────────────────────────────────────────────────────────────

export function EmptyState({ icon: Icon, message, hint }) {
  return (
    <div className="text-center py-16 text-slate-400">
      <Icon className="h-10 w-10 mx-auto mb-3 opacity-40" />
      <p className="font-medium">{message}</p>
      {hint && <p className="text-sm mt-1">{hint}</p>}
    </div>
  );
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────

export function StatusBadge({ active }) {
  return active ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200">
      <CheckCircle className="h-3 w-3" /> Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border bg-slate-100 text-slate-600 border-slate-200">
      <XCircle className="h-3 w-3" /> Inactive
    </span>
  );
}

// ─── RoleBadge ───────────────────────────────────────────────────────────────

const ROLE_STYLES = {
  BusinessManager: "bg-rose-50 text-rose-700 border-rose-200",
  UnitHead:        "bg-purple-50 text-purple-700 border-purple-200",
  Counsellor:      "bg-blue-50 text-blue-700 border-blue-200",
};

const ROLE_LABELS = {
  BusinessManager: "Business Manager",
  UnitHead:        "Unit Head",
  Counsellor:      "Counsellor",
};

export function RoleBadge({ role }) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border", ROLE_STYLES[role] || "bg-slate-100 text-slate-700 border-slate-200")}>
      {ROLE_LABELS[role] || role}
    </span>
  );
}

// ─── Avatar ──────────────────────────────────────────────────────────────────

export function Avatar({ name = "", className = "" }) {
  const parts = name.trim().split(" ");
  const initials =
    parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  return (
    <span className={cn("inline-flex items-center justify-center rounded-xl bg-rose-50 text-[#8B1E1E] font-bold border border-rose-200/60 text-xs", className)}>
      {initials}
    </span>
  );
}

// ─── FormField ───────────────────────────────────────────────────────────────
// Replaces the inline Field + Input + Select combos in each section.

export function FormField({ label, required, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

export function AdminInput({ className, ...props }) {
  return (
    <input
      {...props}
      className={cn(
        "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1E1E]/30 focus:border-[#8B1E1E] transition-all bg-white",
        className
      )}
    />
  );
}

export function AdminSelect({ children, className, ...props }) {
  return (
    <select
      {...props}
      className={cn(
        "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1E1E]/30 focus:border-[#8B1E1E] transition-all bg-white",
        className
      )}
    >
      {children}
    </select>
  );
}

// ─── AdminModal ──────────────────────────────────────────────────────────────
// Lightweight modal wrapper used by all admin section forms.

export function AdminModal({ open, onClose, title, size = "md", children }) {
  if (!open) return null;
  const widths = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl" };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className={cn("relative bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-h-[90vh] overflow-y-auto", widths[size])}>
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <XCircle className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── ConfirmDeleteModal ───────────────────────────────────────────────────────

export function ConfirmDeleteModal({ open, name, onConfirm, onCancel }) {
  return (
    <AdminModal open={open} onClose={onCancel} title="Confirm Delete" size="sm">
      <p className="text-slate-600 text-sm mb-6">
        Are you sure you want to delete{" "}
        <span className="font-semibold text-slate-900">{name}</span>? This action cannot be undone.
      </p>
      <div className="flex gap-3 justify-end">
        <button onClick={onCancel} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
          Cancel
        </button>
        <button onClick={onConfirm} className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors">
          Delete
        </button>
      </div>
    </AdminModal>
  );
}

// ─── ModalActions ─────────────────────────────────────────────────────────────
// Consistent Save / Cancel buttons for all admin modals.

export function ModalActions({ onCancel, onSave, saving, saveLabel = "Save" }) {
  return (
    <div className="flex gap-3 pt-2 justify-end">
      <button onClick={onCancel} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
        Cancel
      </button>
      <button onClick={onSave} disabled={saving} className="px-5 py-2 rounded-xl bg-[#8B1E1E] text-white text-sm font-semibold hover:bg-[#6d1414] transition-colors disabled:opacity-60">
        {saving ? "Saving…" : saveLabel}
      </button>
    </div>
  );
}

// ─── AdminTable ──────────────────────────────────────────────────────────────
// A generic table wrapper so every section doesn't re-declare <table> boilerplate.

export function AdminTable({ headers, children }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                className={cn(
                  "px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider",
                  h === "Actions" ? "text-right" : "text-left"
                )}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}

// ─── ActionButtons ────────────────────────────────────────────────────────────
// Consistent icon-button row used for Edit / Delete / Toggle per table row.

export function RowActions({ onEdit, onDelete, onToggle, isActive }) {
  return (
    <div className="flex items-center gap-1.5 justify-end">
      {onToggle !== undefined && (
        <button
          onClick={onToggle}
          title={isActive ? "Deactivate" : "Activate"}
          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
        >
          {isActive ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
        </button>
      )}
      {onEdit && (
        <button onClick={onEdit} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
      )}
      {onDelete && (
        <button onClick={onDelete} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </button>
      )}
    </div>
  );
}
