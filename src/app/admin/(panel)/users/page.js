"use client";

import { useState } from "react";
import { Eye, EyeOff, Users } from "lucide-react";
import { useCrud } from "@/features/admin/hooks/useCrud";
import {
  SectionShell, EmptyState,
  AdminTable, RowActions,
  AdminModal, ModalActions, FormField, AdminInput, AdminSelect,
  ConfirmDeleteModal, StatusBadge, RoleBadge, Avatar,
} from "@/features/admin/components/ui";
import { useToast } from "@/components/ui/Toast";

const EMPTY_FORM = {
  name: "", email: "", employee_id: "", password: "",
  role: "Counsellor", phone: "", unit_id: "",
};

export default function AdminUsersPage() {
  const { addToast } = useToast();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [showPassword, setShowPassword] = useState(false);

  const {
    items: users, loading, modalOpen, setModalOpen, editItem,
    deleteTarget, setDeleteTarget, saving,
    form, setForm, openAdd, openEdit, save, remove, refresh, toggleActive,
  } = useCrud({ endpoint: "/api/admin/users", emptyForm: EMPTY_FORM, itemKey: "users" });

  // Also fetch units for the unit selector in the form
  const [units, setUnits] = useState([]);
  useState(() => {
    fetch("/api/admin/units").then(r => r.json()).then(d => {
      if (d.success) setUnits(d.units);
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    const result = await save((f, isEdit) => {
      if (!f.name || (!f.email && !f.employee_id) || (!isEdit && !f.password) || !f.role)
        return "Please fill in all required fields (including Email or Employee ID)";
    });
    if (result?.error) addToast({ title: "Error", description: result.error, type: "error" });
    else if (result?.success) addToast({ title: "Success", description: editItem ? "User updated" : "User added", type: "success" });
  };

  const handleDelete = async () => {
    const result = await remove();
    if (result?.error) addToast({ title: "Error", description: result.error, type: "error" });
    else addToast({ title: "Success", description: "User deleted", type: "success" });
  };

  const handleToggle = async (u) => {
    const result = await toggleActive(u);
    if (result?.error) addToast({ title: "Error", description: result.error, type: "error" });
    else addToast({ title: "Success", description: `User ${u.is_active ? "deactivated" : "activated"}`, type: "success" });
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = u.name.toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q) || (u.phone || "").includes(q);
    const matchRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <SectionShell
      title="Users"
      description="Manage Business Managers, Unit Heads and Counsellors"
      search={search}
      onSearch={setSearch}
      onRefresh={refresh}
      onAdd={openAdd}
      addLabel="Add User"
      loading={loading}
    >
      {/* Role filter */}
      <div className="mb-4">
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
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} message="No users found" hint="Add your first user using the button above" />
      ) : (
        <AdminTable headers={["User", "Role", "Contact", "Unit", "Status", "Actions"]}>
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
              <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
              <td className="px-4 py-3 text-slate-600">{u.phone || <span className="text-slate-300">—</span>}</td>
              <td className="px-4 py-3 text-slate-600">{u.unit_name || <span className="text-slate-300">—</span>}</td>
              <td className="px-4 py-3"><StatusBadge active={u.is_active} /></td>
              <td className="px-4 py-3">
                <RowActions
                  onToggle={() => handleToggle(u)}
                  isActive={u.is_active}
                  onEdit={() => openEdit(u)}
                  onDelete={() => setDeleteTarget(u)}
                />
              </td>
            </tr>
          ))}
        </AdminTable>
      )}

      {/* Add / Edit Modal */}
      <AdminModal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? "Edit User" : "Add New User"} size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <FormField label="Full Name" required>
                <AdminInput value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Rahul Sharma" />
              </FormField>
            </div>
            <FormField label="Role" required>
              <AdminSelect value={form.role} onChange={(e) => setForm(p => ({ ...p, role: e.target.value }))}>
                <option value="BusinessManager">Business Manager</option>
                <option value="UnitHead">Unit Head</option>
                <option value="Counsellor">Counsellor</option>
              </AdminSelect>
            </FormField>
            <FormField label="Assign to Unit">
              <AdminSelect value={form.unit_id} onChange={(e) => setForm(p => ({ ...p, unit_id: e.target.value }))}>
                <option value="">No unit</option>
                {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </AdminSelect>
            </FormField>
            <FormField label="Employee ID" required>
              <AdminInput value={form.employee_id} onChange={(e) => setForm(p => ({ ...p, employee_id: e.target.value }))} placeholder="EMP-001" />
            </FormField>
            <FormField label="Email">
              <AdminInput type="email" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} placeholder="user@comparedegree.com" />
            </FormField>
            <FormField label="Phone">
              <AdminInput type="tel" value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+91 98765 43210" />
            </FormField>
            <FormField label={editItem ? "New Password (leave blank to keep)" : "Password"} required={!editItem}>
              <div className="relative">
                <AdminInput
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </FormField>
          </div>
          <ModalActions onCancel={() => setModalOpen(false)} onSave={handleSave} saving={saving} saveLabel={editItem ? "Update User" : "Add User"} />
        </div>
      </AdminModal>

      <ConfirmDeleteModal open={!!deleteTarget} name={deleteTarget?.name} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </SectionShell>
  );
}
