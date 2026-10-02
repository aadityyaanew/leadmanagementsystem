"use client";

import { useState, useEffect } from "react";
import { Building2, MapPin } from "lucide-react";
import { useCrud } from "@/features/admin/hooks/useCrud";
import {
  SectionShell, EmptyState,
  AdminModal, ModalActions, FormField, AdminInput, AdminSelect,
  ConfirmDeleteModal, StatusBadge,
} from "@/features/admin/components/ui";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

const EMPTY_FORM = { name: "", location: "", head_user_id: "" };

export default function AdminUnitsPage() {
  const { addToast } = useToast();
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);

  const {
    items: units, loading, modalOpen, setModalOpen, editItem,
    deleteTarget, setDeleteTarget, saving,
    form, setForm, openAdd, openEdit, save, remove, refresh,
  } = useCrud({ endpoint: "/api/admin/units", emptyForm: EMPTY_FORM, itemKey: "units" });

  useEffect(() => {
    fetch("/api/admin/users").then(r => r.json()).then(d => {
      if (d.success) setUsers(d.users);
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    const result = await save((f) => { if (!f.name) return "Unit name is required"; });
    if (result?.error) addToast({ title: "Error", description: result.error, type: "error" });
    else if (result?.success) addToast({ title: "Success", description: editItem ? "Unit updated" : "Unit added", type: "success" });
  };

  const handleDelete = async () => {
    const result = await remove();
    if (result?.error) addToast({ title: "Error", description: result.error, type: "error" });
    else addToast({ title: "Deleted", description: "Unit removed", type: "success" });
  };

  const filtered = units.filter((u) => {
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || (u.location || "").toLowerCase().includes(q);
  });

  return (
    <SectionShell
      title="Units"
      description="Manage sales and admission centers"
      search={search}
      onSearch={setSearch}
      onRefresh={refresh}
      onAdd={openAdd}
      addLabel="Add Unit"
      loading={loading}
    >
      {filtered.length === 0 ? (
        <EmptyState icon={Building2} message="No units found" hint="Add your first unit using the button above" />
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
                  <span className="text-[11px] text-purple-700 font-medium">Head: {u.head_name}</span>
                </div>
              )}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <button onClick={() => openEdit(u)} className="flex-1 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1.5 justify-center">
                  Edit
                </button>
                <button onClick={() => setDeleteTarget(u)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AdminModal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? "Edit Unit" : "Add Unit"} size="sm">
        <div className="space-y-4">
          <FormField label="Unit Name" required>
            <AdminInput value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Unit Name Inside Sales" />
          </FormField>
          <FormField label="Location / City">
            <AdminInput value={form.location} onChange={(e) => setForm(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Delhi, Mumbai" />
          </FormField>
          <FormField label="Unit Head">
            <AdminSelect value={form.head_user_id} onChange={(e) => setForm(p => ({ ...p, head_user_id: e.target.value }))}>
              <option value="">No head assigned</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </AdminSelect>
          </FormField>
          <ModalActions onCancel={() => setModalOpen(false)} onSave={handleSave} saving={saving} saveLabel={editItem ? "Update" : "Add Unit"} />
        </div>
      </AdminModal>

      <ConfirmDeleteModal open={!!deleteTarget} name={deleteTarget?.name} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </SectionShell>
  );
}
