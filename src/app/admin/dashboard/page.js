"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Building2,
  BookOpen,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Search,
  ChevronDown,
  X,
  Shield,
  CheckCircle,
  XCircle,
  ArrowLeft,
  RefreshCw,
  Eye,
  EyeOff,
  LayoutDashboard,
  UserCog,
  GraduationCap,
  Landmark,
  LogOut,
} from "lucide-react";

// ─── Helpers ────────────────────────────────────────────────────────────────

function Avatar({ name = "", className = "" }) {
  const parts = name.trim().split(" ");
  const initials =
    parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  return (
    <span
      className={`inline-flex items-center justify-center rounded-xl bg-rose-50 text-[#8B1E1E] font-bold border border-rose-200/60 text-xs ${className}`}
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
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${map[color] || map.slate}`}
    >
      {children}
    </span>
  );
}

function StatusBadge({ active }) {
  return active ? (
    <Badge color="emerald">
      <CheckCircle className="h-3 w-3 mr-1" /> Active
    </Badge>
  ) : (
    <Badge color="slate">
      <XCircle className="h-3 w-3 mr-1" /> Inactive
    </Badge>
  );
}

function roleColor(role) {
  if (role === "BusinessManager") return "rose";
  if (role === "UnitHead") return "purple";
  if (role === "Counsellor") return "blue";
  return "slate";
}

function roleLabel(role) {
  if (role === "BusinessManager") return "Business Manager";
  if (role === "UnitHead") return "Unit Head";
  if (role === "Counsellor") return "Counsellor";
  return role;
}

// ─── Toast ──────────────────────────────────────────────────────────────────

function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);
  return { toasts, add };
}

function Toasts({ toasts }) {
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

// ─── Modal ──────────────────────────────────────────────────────────────────

function Modal({ open, onClose, title, children, size = "md" }) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;
  const widths = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative bg-white rounded-2xl shadow-2xl border border-slate-100 w-full ${widths[size]} max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── Confirm Delete ─────────────────────────────────────────────────────────

function ConfirmDelete({ open, name, onConfirm, onCancel }) {
  return (
    <Modal open={open} onClose={onCancel} title="Confirm Delete" size="sm">
      <p className="text-slate-600 text-sm mb-6">
        Are you sure you want to delete{" "}
        <span className="font-semibold text-slate-900">{name}</span>? This
        action cannot be undone.
      </p>
      <div className="flex gap-3 justify-end">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
        >
          Delete
        </button>
      </div>
    </Modal>
  );
}

// ─── Field ──────────────────────────────────────────────────────────────────

function Field({ label, required, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function Input({ ...props }) {
  return (
    <input
      {...props}
      className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1E1E]/30 focus:border-[#8B1E1E] transition-all bg-white ${props.className || ""}`}
    />
  );
}

function Select({ children, ...props }) {
  return (
    <select
      {...props}
      className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1E1E]/30 focus:border-[#8B1E1E] transition-all bg-white ${props.className || ""}`}
    >
      {children}
    </select>
  );
}

// ─── USERS SECTION ──────────────────────────────────────────────────────────

function UsersSection({ toast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [units, setUnits] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    employee_id: "",
    password: "",
    role: "Counsellor",
    phone: "",
    unit_id: "",
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.success) setUsers(data.users);
    } catch {
      toast("Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchUnits = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/units");
      const data = await res.json();
      if (data.success) setUnits(data.units);
    } catch {}
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchUnits();
  }, [fetchUsers, fetchUnits]);

  const openAdd = () => {
    setEditUser(null);
    setForm({ name: "", email: "", employee_id: "", password: "", role: "Counsellor", phone: "", unit_id: "" });
    setShowPassword(false);
    setModalOpen(true);
  };

  const openEdit = (u) => {
    setEditUser(u);
    setForm({
      name: u.name,
      email: u.email || "",
      employee_id: u.employee_id || "",
      password: "",
      role: u.role,
      phone: u.phone || "",
      unit_id: u.unit_id || "",
    });
    setShowPassword(false);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || (!form.email && !form.employee_id) || (!editUser && !form.password) || !form.role) {
      toast("Please fill in all required fields (including Email or Employee ID)", "error");
      return;
    }
    setSaving(true);
    try {
      const method = editUser ? "PUT" : "POST";
      const body = editUser
        ? { id: editUser.id, ...form }
        : { ...form };
      const res = await fetch("/api/admin/users", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast(editUser ? "User updated successfully" : "User added successfully");
      setModalOpen(false);
      fetchUsers();
    } catch (e) {
      toast(e.message || "Failed to save user", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/admin/users?id=${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast("User deleted successfully");
      setDeleteTarget(null);
      fetchUsers();
    } catch (e) {
      toast(e.message || "Failed to delete user", "error");
    }
  };

  const handleToggleActive = async (u) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: u.id, is_active: u.is_active ? 0 : 1 }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast(`User ${u.is_active ? "deactivated" : "activated"}`);
      fetchUsers();
    } catch (e) {
      toast(e.message || "Failed to update status", "error");
    }
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.phone || "").includes(q);
    const matchRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or phone…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1E1E]/30 focus:border-[#8B1E1E] transition-all"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1E1E]/30 focus:border-[#8B1E1E] bg-white"
        >
          <option value="ALL">All Roles</option>
          <option value="BusinessManager">Business Manager</option>
          <option value="UnitHead">Unit Head</option>
          <option value="Counsellor">Counsellor</option>
        </select>
        <button
          onClick={fetchUsers}
          className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#8B1E1E] text-white text-sm font-semibold hover:bg-[#6d1414] transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> Add User
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No users found</p>
          <p className="text-sm mt-1">Add your first user using the button above</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Unit</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} className="h-8 w-8 text-sm" />
                      <div>
                        <p className="font-semibold text-slate-900">{u.name}</p>
                        <p className="text-[11px] text-slate-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge color={roleColor(u.role)}>{roleLabel(u.role)}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{u.phone || <span className="text-slate-300">—</span>}</td>
                  <td className="px-4 py-3 text-slate-600">{u.unit_name || <span className="text-slate-300">—</span>}</td>
                  <td className="px-4 py-3">
                    <StatusBadge active={u.is_active} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 justify-end">
                      <button
                        onClick={() => handleToggleActive(u)}
                        title={u.is_active ? "Deactivate" : "Activate"}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                      >
                        {u.is_active ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => openEdit(u)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(u)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editUser ? "Edit User" : "Add New User"}
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Field label="Full Name" required>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Rahul Sharma"
                />
              </Field>
            </div>
            <Field label="Role" required>
              <Select
                value={form.role}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
              >
                <option value="BusinessManager">Business Manager</option>
                <option value="UnitHead">Unit Head</option>
                <option value="Counsellor">Counsellor</option>
              </Select>
            </Field>
            <Field label="Assign to Unit">
              <Select
                value={form.unit_id}
                onChange={(e) => setForm((p) => ({ ...p, unit_id: e.target.value }))}
              >
                <option value="">No unit</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Employee ID" required>
              <Input
                type="text"
                value={form.employee_id}
                onChange={(e) => setForm((p) => ({ ...p, employee_id: e.target.value }))}
                placeholder="EMP-001"
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="user@comparedegree.com"
              />
            </Field>
            <Field label="Phone">
              <Input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="+91 98765 43210"
              />
            </Field>
            <Field label={editUser ? "New Password (leave blank to keep)" : "Password"} required={!editUser}>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
          </div>

          <div className="flex gap-3 pt-2 justify-end">
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-[#8B1E1E] text-white text-sm font-semibold hover:bg-[#6d1414] transition-colors disabled:opacity-60"
            >
              {saving ? "Saving…" : editUser ? "Update User" : "Add User"}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDelete
        open={!!deleteTarget}
        name={deleteTarget?.name}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// ─── COLLEGES SECTION ────────────────────────────────────────────────────────

function CollegesSection({ toast }) {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", location: "" });

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/colleges");
      const data = await res.json();
      if (data.success) setColleges(data.colleges);
    } catch { toast("Failed to load colleges", "error"); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const openAdd = () => { setEditItem(null); setForm({ name: "", location: "" }); setModalOpen(true); };
  const openEdit = (c) => { setEditItem(c); setForm({ name: c.name, location: c.location || "" }); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.name) { toast("College name is required", "error"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/colleges", {
        method: editItem ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editItem ? { id: editItem.id, ...form } : form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast(editItem ? "College updated" : "College added");
      setModalOpen(false);
      fetch_();
    } catch (e) { toast(e.message || "Failed to save", "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/admin/colleges?id=${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast("College deleted");
      setDeleteTarget(null);
      fetch_();
    } catch (e) { toast(e.message || "Failed to delete", "error"); }
  };

  const handleToggle = async (c) => {
    try {
      await fetch("/api/admin/colleges", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: c.id, is_active: c.is_active ? 0 : 1 }),
      });
      toast(`College ${c.is_active ? "deactivated" : "activated"}`);
      fetch_();
    } catch { toast("Failed to update", "error"); }
  };

  const filtered = colleges.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.location || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search colleges…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1E1E]/30 focus:border-[#8B1E1E] transition-all"
          />
        </div>
        <button onClick={fetch_} className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
          <RefreshCw className="h-4 w-4" />
        </button>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#8B1E1E] text-white text-sm font-semibold hover:bg-[#6d1414] transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> Add College
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Landmark className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No colleges found</p>
          <p className="text-sm mt-1">Add your first college using the button above</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <div key={c.id} className={`rounded-2xl border p-5 transition-all hover:shadow-md ${c.is_active ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50 opacity-70"}`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center flex-shrink-0">
                    <Landmark className="h-5 w-5 text-[#8B1E1E]" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm leading-tight">{c.name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                      {c.location ? <><MapPin className="h-3 w-3" />{c.location}</> : "No location set"}
                    </p>
                  </div>
                </div>
                <StatusBadge active={c.is_active} />
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <button onClick={() => handleToggle(c)} className="flex-1 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                  {c.is_active ? "Deactivate" : "Activate"}
                </button>
                <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => setDeleteTarget(c)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? "Edit College" : "Add College"} size="sm">
        <div className="space-y-4">
          <Field label="College Name" required>
            <Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Shoolini University" />
          </Field>
          <Field label="Location / City">
            <Input value={form.location} onChange={(e) => setForm(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Solan, Himachal Pradesh" />
          </Field>
          <div className="flex gap-3 pt-2 justify-end">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-xl bg-[#8B1E1E] text-white text-sm font-semibold hover:bg-[#6d1414] transition-colors disabled:opacity-60">
              {saving ? "Saving…" : editItem ? "Update" : "Add College"}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDelete open={!!deleteTarget} name={deleteTarget?.name} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}

// ─── COURSES SECTION ─────────────────────────────────────────────────────────

function CoursesSection({ toast }) {
  const [courses, setCourses] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [collegeFilter, setCollegeFilter] = useState("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", college_id: "", duration: "" });

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const [cr, cl] = await Promise.all([
        fetch("/api/admin/courses").then(r => r.json()),
        fetch("/api/admin/colleges").then(r => r.json()),
      ]);
      if (cr.success) setCourses(cr.courses);
      if (cl.success) setColleges(cl.colleges);
    } catch { toast("Failed to load", "error"); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const openAdd = () => { setEditItem(null); setForm({ name: "", college_id: "", duration: "" }); setModalOpen(true); };
  const openEdit = (c) => { setEditItem(c); setForm({ name: c.name, college_id: c.college_id || "", duration: c.duration || "" }); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.name) { toast("Course name is required", "error"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/courses", {
        method: editItem ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editItem ? { id: editItem.id, ...form } : form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast(editItem ? "Course updated" : "Course added");
      setModalOpen(false);
      fetchCourses();
    } catch (e) { toast(e.message || "Failed to save", "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/admin/courses?id=${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast("Course deleted");
      setDeleteTarget(null);
      fetchCourses();
    } catch (e) { toast(e.message || "Failed to delete", "error"); }
  };

  const filtered = courses.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch = c.name.toLowerCase().includes(q) || (c.college_name || "").toLowerCase().includes(q);
    const matchCollege = collegeFilter === "ALL" || String(c.college_id) === String(collegeFilter);
    return matchSearch && matchCollege;
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search courses…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1E1E]/30 focus:border-[#8B1E1E] transition-all" />
        </div>
        <select value={collegeFilter} onChange={(e) => setCollegeFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1E1E]/30 focus:border-[#8B1E1E] bg-white">
          <option value="ALL">All Colleges</option>
          {colleges.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button onClick={fetchCourses} className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
          <RefreshCw className="h-4 w-4" />
        </button>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#8B1E1E] text-white text-sm font-semibold hover:bg-[#6d1414] transition-colors shadow-sm">
          <Plus className="h-4 w-4" /> Add Course
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No courses found</p>
          <p className="text-sm mt-1">Add your first course using the button above</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Course</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">College</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Duration</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="font-semibold text-slate-900">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{c.college_name || <span className="text-slate-300">—</span>}</td>
                  <td className="px-4 py-3 text-slate-600">{c.duration || <span className="text-slate-300">—</span>}</td>
                  <td className="px-4 py-3"><StatusBadge active={c.is_active} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 justify-end">
                      <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => setDeleteTarget(c)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? "Edit Course" : "Add Course"} size="sm">
        <div className="space-y-4">
          <Field label="Course Name" required>
            <Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. MBA, BCA, M.Com" />
          </Field>
          <Field label="College">
            <Select value={form.college_id} onChange={(e) => setForm(p => ({ ...p, college_id: e.target.value }))}>
              <option value="">No specific college</option>
              {colleges.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label="Duration">
            <Input value={form.duration} onChange={(e) => setForm(p => ({ ...p, duration: e.target.value }))} placeholder="e.g. 2 Years, 3 Years" />
          </Field>
          <div className="flex gap-3 pt-2 justify-end">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-xl bg-[#8B1E1E] text-white text-sm font-semibold hover:bg-[#6d1414] transition-colors disabled:opacity-60">
              {saving ? "Saving…" : editItem ? "Update" : "Add Course"}
            </button>
          </div>
        </div>
      </Modal>
      <ConfirmDelete open={!!deleteTarget} name={deleteTarget?.name} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}

// ─── UNITS SECTION ────────────────────────────────────────────────────────────

function UnitsSection({ toast }) {
  const [units, setUnits] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", location: "", head_user_id: "" });

  const fetchUnits = useCallback(async () => {
    setLoading(true);
    try {
      const [ur, us] = await Promise.all([
        fetch("/api/admin/units").then(r => r.json()),
        fetch("/api/admin/users").then(r => r.json()),
      ]);
      if (ur.success) setUnits(ur.units);
      if (us.success) setUsers(us.users.filter(u => u.role === "UnitHead"));
    } catch { toast("Failed to load", "error"); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { fetchUnits(); }, [fetchUnits]);

  const openAdd = () => { setEditItem(null); setForm({ name: "", location: "", head_user_id: "" }); setModalOpen(true); };
  const openEdit = (u) => { setEditItem(u); setForm({ name: u.name, location: u.location || "", head_user_id: u.head_user_id || "" }); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.name) { toast("Unit name is required", "error"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/units", {
        method: editItem ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editItem ? { id: editItem.id, ...form } : form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast(editItem ? "Unit updated" : "Unit added");
      setModalOpen(false);
      fetchUnits();
    } catch (e) { toast(e.message || "Failed to save", "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/admin/units?id=${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast("Unit deleted");
      setDeleteTarget(null);
      fetchUnits();
    } catch (e) { toast(e.message || "Failed to delete", "error"); }
  };

  const filtered = units.filter((u) => {
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || (u.location || "").toLowerCase().includes(q) || (u.head_name || "").toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search units…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1E1E]/30 focus:border-[#8B1E1E] transition-all" />
        </div>
        <button onClick={fetchUnits} className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
          <RefreshCw className="h-4 w-4" />
        </button>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#8B1E1E] text-white text-sm font-semibold hover:bg-[#6d1414] transition-colors shadow-sm">
          <Plus className="h-4 w-4" /> Add Unit
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Building2 className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No units found</p>
          <p className="text-sm mt-1">Add your first unit using the button above</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((u) => (
            <div key={u.id} className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{u.name}</p>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      {u.location ? <><MapPin className="h-3 w-3" />{u.location}</> : "No location"}
                    </p>
                  </div>
                </div>
                <StatusBadge active={u.is_active} />
              </div>
              {u.head_name && (
                <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-purple-50/50 rounded-xl border border-purple-100">
                  <UserCog className="h-3.5 w-3.5 text-purple-500 flex-shrink-0" />
                  <span className="text-[11px] text-purple-700 font-medium">Head: {u.head_name}</span>
                </div>
              )}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <button onClick={() => openEdit(u)} className="flex-1 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1.5 justify-center">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button onClick={() => setDeleteTarget(u)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? "Edit Unit" : "Add Unit"} size="sm">
        <div className="space-y-4">
          <Field label="Unit Name" required>
            <Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Unit Name Inside Sales" />
          </Field>
          <Field label="Location / City">
            <Input value={form.location} onChange={(e) => setForm(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Delhi, Mumbai" />
          </Field>
          <Field label="Unit Head">
            <Select value={form.head_user_id} onChange={(e) => setForm(p => ({ ...p, head_user_id: e.target.value }))}>
              <option value="">No head assigned</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </Select>
          </Field>
          <div className="flex gap-3 pt-2 justify-end">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-xl bg-[#8B1E1E] text-white text-sm font-semibold hover:bg-[#6d1414] transition-colors disabled:opacity-60">
              {saving ? "Saving…" : editItem ? "Update" : "Add Unit"}
            </button>
          </div>
        </div>
      </Modal>
      <ConfirmDelete open={!!deleteTarget} name={deleteTarget?.name} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}

// ─── STATS CARDS ─────────────────────────────────────────────────────────────

function StatsCard({ icon: Icon, label, value, color, subtitle }) {
  const colors = {
    rose: "bg-rose-50 text-[#8B1E1E] border-rose-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    purple: "bg-purple-50 text-purple-700 border-purple-100",
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

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "colleges", label: "Colleges", icon: Landmark },
  { id: "courses", label: "Courses", icon: GraduationCap },
  { id: "units", label: "Units", icon: Building2 },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [stats, setStats] = useState({ users: 0, colleges: 0, courses: 0, units: 0 });
  const { toasts, add: toast } = useToast();

  const handleLogout = useCallback(() => {
    try {
      localStorage.setItem("crm_lms_is_auth", "false");
    } catch (e) {}
    window.location.href = "/";
  }, []);

  // Check admin auth from localStorage
  useEffect(() => {
    try {
      const role = localStorage.getItem("crm_lms_current_role_v1");
      const isAuth = localStorage.getItem("crm_lms_is_auth") === "true";
      if (isAuth && role === "ADMIN") {
        setIsAuthenticated(true);
      }
    } catch {}
    setCheckingAuth(false);
  }, []);

  // Fetch overview stats
  const fetchStats = useCallback(async () => {
    try {
      const [u, c, co, un] = await Promise.all([
        fetch("/api/admin/users").then(r => r.json()),
        fetch("/api/admin/colleges").then(r => r.json()),
        fetch("/api/admin/courses").then(r => r.json()),
        fetch("/api/admin/units").then(r => r.json()),
      ]);
      setStats({
        users: u.success ? u.users.length : 0,
        colleges: c.success ? c.colleges.length : 0,
        courses: co.success ? co.courses.length : 0,
        units: un.success ? un.units.length : 0,
      });
    } catch {}
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchStats();
  }, [isAuthenticated, fetchStats]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#FBFBFC] flex items-center justify-center">
        <div className="text-slate-400 text-sm">Loading…</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FBFBFC] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-10 text-center max-w-sm w-full">
          <div className="h-14 w-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-5">
            <Shield className="h-7 w-7 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Access Restricted</h1>
          <p className="text-sm text-slate-500 mb-6">
            You must be logged in as an Admin to access this panel.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#8B1E1E] text-white text-sm font-semibold hover:bg-[#6d1414] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFC]">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <img src="/logo.jpeg" alt="CMS Logo" className="h-12 w-auto object-contain mix-blend-multiply" />
            <div className="hidden sm:block border-l border-slate-200 pl-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8B1E1E]">Admin Panel</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-[#8B1E1E] border border-rose-200">PRO</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">System Administration & Configuration</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/admin/crm"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to CRM</span>
            </a>
            <a
              href="/profile"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-blue-200 bg-blue-50 text-sm font-medium text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-colors"
            >
              <UserCog className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </a>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-red-200 bg-red-50 text-sm font-medium text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Manage users, colleges, courses and unit configurations</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 bg-slate-100/80 rounded-2xl p-1.5 mb-8 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); if (tab.id === "overview") fetchStats(); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-white text-[#8B1E1E] shadow-sm border border-slate-200/80 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 min-h-[500px]">
          {activeTab === "overview" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-900">System Overview</h2>
                <button onClick={fetchStats} className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  <RefreshCw className="h-3.5 w-3.5" /> Refresh
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatsCard icon={Users} label="Total Users" value={stats.users} color="rose" subtitle="Business Mgr, Unit Heads, Counsellors" />
                <StatsCard icon={Landmark} label="Colleges" value={stats.colleges} color="blue" subtitle="Partner institutions" />
                <StatsCard icon={GraduationCap} label="Courses" value={stats.courses} color="purple" subtitle="Available programs" />
                <StatsCard icon={Building2} label="Units" value={stats.units} color="emerald" subtitle="Sales & admission centers" />
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
          )}
          {activeTab === "users" && <UsersSection toast={toast} />}
          {activeTab === "colleges" && <CollegesSection toast={toast} />}
          {activeTab === "courses" && <CoursesSection toast={toast} />}
          {activeTab === "units" && <UnitsSection toast={toast} />}
        </div>
      </div>

      <Toasts toasts={toasts} />
    </div>
  );
}
