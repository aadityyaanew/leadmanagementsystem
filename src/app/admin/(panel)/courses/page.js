"use client";

import { useState, useEffect } from "react";
import { GraduationCap, BookOpen } from "lucide-react";
import { useCrud } from "@/features/admin/hooks/useCrud";
import {
  SectionShell, EmptyState,
  AdminTable, RowActions,
  AdminModal, ModalActions, FormField, AdminInput, AdminSelect,
  ConfirmDeleteModal, StatusBadge,
} from "@/features/admin/components/ui";
import { useToast } from "@/components/ui/Toast";

const EMPTY_FORM = { name: "", college_id: "", duration: "" };

export default function AdminCoursesPage() {
  const { addToast } = useToast();
  const [search, setSearch] = useState("");
  const [colleges, setColleges] = useState([]);

  const {
    items: courses, loading, modalOpen, setModalOpen, editItem,
    deleteTarget, setDeleteTarget, saving,
    form, setForm, openAdd, openEdit, save, remove, refresh,
  } = useCrud({ endpoint: "/api/admin/courses", emptyForm: EMPTY_FORM, itemKey: "courses" });

  useEffect(() => {
    fetch("/api/admin/colleges").then(r => r.json()).then(d => {
      if (d.success) setColleges(d.colleges);
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    const result = await save((f) => {
      if (!f.name) return "Course name is required";
    });
    if (result?.error) addToast({ title: "Error", description: result.error, type: "error" });
    else if (result?.success) addToast({ title: "Success", description: editItem ? "Course updated" : "Course added", type: "success" });
  };

  const handleDelete = async () => {
    const result = await remove();
    if (result?.error) addToast({ title: "Error", description: result.error, type: "error" });
    else addToast({ title: "Deleted", description: "Course removed", type: "success" });
  };

  const filtered = courses.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.college_name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SectionShell
      title="Courses"
      description="Manage programs and courses offered by colleges"
      search={search}
      onSearch={setSearch}
      onRefresh={refresh}
      onAdd={openAdd}
      addLabel="Add Course"
      loading={loading}
    >
      {filtered.length === 0 ? (
        <EmptyState icon={GraduationCap} message="No courses found" hint="Add your first course using the button above" />
      ) : (
        <AdminTable headers={["Course", "College", "Duration", "Status", "Actions"]}>
          {filtered.map((c) => (
            <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="h-4 w-4 text-purple-600" />
                  </div>
                  <p className="font-semibold text-slate-900 text-sm">{c.name}</p>
                </div>
              </td>
              <td className="px-4 py-3 text-slate-600 text-sm">{c.college_name || <span className="text-slate-300">—</span>}</td>
              <td className="px-4 py-3 text-slate-600 text-sm">{c.duration || <span className="text-slate-300">—</span>}</td>
              <td className="px-4 py-3"><StatusBadge active={c.is_active} /></td>
              <td className="px-4 py-3">
                <RowActions onEdit={() => openEdit(c)} onDelete={() => setDeleteTarget(c)} />
              </td>
            </tr>
          ))}
        </AdminTable>
      )}

      <AdminModal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? "Edit Course" : "Add Course"} size="sm">
        <div className="space-y-4">
          <FormField label="Course Name" required>
            <AdminInput value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. MBA, BCA" />
          </FormField>
          <FormField label="College">
            <AdminSelect value={form.college_id} onChange={(e) => setForm(p => ({ ...p, college_id: e.target.value }))}>
              <option value="">No college</option>
              {colleges.map((col) => <option key={col.id} value={col.id}>{col.name}</option>)}
            </AdminSelect>
          </FormField>
          <FormField label="Duration">
            <AdminInput value={form.duration} onChange={(e) => setForm(p => ({ ...p, duration: e.target.value }))} placeholder="e.g. 2 Years" />
          </FormField>
          <ModalActions onCancel={() => setModalOpen(false)} onSave={handleSave} saving={saving} saveLabel={editItem ? "Update" : "Add Course"} />
        </div>
      </AdminModal>

      <ConfirmDeleteModal open={!!deleteTarget} name={deleteTarget?.name} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </SectionShell>
  );
}
