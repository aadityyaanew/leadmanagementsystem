"use client";

import { useState } from "react";
import { Landmark, MapPin } from "lucide-react";
import { useCrud } from "@/features/admin/hooks/useCrud";
import {
  SectionShell, EmptyState,
  AdminModal, ModalActions, FormField, AdminInput,
  ConfirmDeleteModal, StatusBadge,
} from "@/features/admin/components/ui";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

const EMPTY_FORM = { name: "", location: "" };

export default function AdminCollegesPage() {
  const { addToast } = useToast();
  const [search, setSearch] = useState("");

  const {
    items: colleges, loading, modalOpen, setModalOpen, editItem,
    deleteTarget, setDeleteTarget, saving,
    form, setForm, openAdd, openEdit, save, remove, refresh, toggleActive,
  } = useCrud({ endpoint: "/api/admin/colleges", emptyForm: EMPTY_FORM, itemKey: "colleges" });

  const handleSave = async () => {
    const result = await save((f) => { if (!f.name) return "College name is required"; });
    if (result?.error) addToast({ title: "Error", description: result.error, type: "error" });
    else if (result?.success) addToast({ title: "Success", description: editItem ? "College updated" : "College added", type: "success" });
  };

  const handleDelete = async () => {
    const result = await remove();
    if (result?.error) addToast({ title: "Error", description: result.error, type: "error" });
    else addToast({ title: "Deleted", description: "College removed", type: "success" });
  };

  const handleToggle = async (c) => {
    const result = await toggleActive(c);
    if (result?.error) addToast({ title: "Error", description: result.error, type: "error" });
    else addToast({ title: "Updated", description: `College ${c.is_active ? "deactivated" : "activated"}`, type: "success" });
  };

  const filtered = colleges.filter((c) => {
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || (c.location || "").toLowerCase().includes(q);
  });

  return (
    <SectionShell
      title="Colleges"
      description="Manage partner institutions"
      search={search}
      onSearch={setSearch}
      onRefresh={refresh}
      onAdd={openAdd}
      addLabel="Add College"
      loading={loading}
    >
      {filtered.length === 0 ? (
        <EmptyState icon={Landmark} message="No colleges found" hint="Add your first college using the button above" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <div
              key={c.id}
              className={cn(
                "rounded-2xl border p-5 transition-all hover:shadow-md",
                c.is_active ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50 opacity-70"
              )}
            >
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
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button onClick={() => setDeleteTarget(c)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AdminModal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? "Edit College" : "Add College"} size="sm">
        <div className="space-y-4">
          <FormField label="College Name" required>
            <AdminInput value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Shoolini University" />
          </FormField>
          <FormField label="Location / City">
            <AdminInput value={form.location} onChange={(e) => setForm(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Solan, Himachal Pradesh" />
          </FormField>
          <ModalActions onCancel={() => setModalOpen(false)} onSave={handleSave} saving={saving} saveLabel={editItem ? "Update" : "Add College"} />
        </div>
      </AdminModal>

      <ConfirmDeleteModal open={!!deleteTarget} name={deleteTarget?.name} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </SectionShell>
  );
}
