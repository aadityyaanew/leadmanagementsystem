"use client";

/**
 * useCrud – a generic CRUD hook for all Admin entity management.
 *
 * Eliminates the 4 × near-identical data-fetching + modal-state blocks
 * that were duplicated across UsersSection, CollegesSection,
 * CoursesSection, and UnitsSection.
 *
 * Usage:
 *   const { items, loading, modalOpen, editItem, saving, deleteTarget,
 *           form, setForm, openAdd, openEdit, save, remove,
 *           refresh, setDeleteTarget, setModalOpen } =
 *     useCrud({ endpoint: "/api/admin/colleges", emptyForm: { name: "", location: "" } });
 */
import { useState, useCallback, useEffect } from "react";

export function useCrud({ endpoint, emptyForm, itemKey }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(endpoint);
      const data = await res.json();
      // API returns e.g. { success, users } or { success, colleges }
      const key = itemKey || Object.keys(data).find((k) => Array.isArray(data[k]));
      if (data.success && key) setItems(data[key]);
      else if (!data.success) setError(data.error || "Failed to load");
    } catch (e) {
      setError(e.message || "Network error");
    } finally {
      setLoading(false);
    }
  }, [endpoint, itemKey]);

  useEffect(() => { refresh(); }, [refresh]);

  const openAdd = useCallback(() => {
    setEditItem(null);
    setForm(emptyForm);
    setModalOpen(true);
  }, [emptyForm]);

  const openEdit = useCallback((item) => {
    setEditItem(item);
    // Populate form with item's fields that match emptyForm keys
    const populated = {};
    Object.keys(emptyForm).forEach((k) => {
      populated[k] = item[k] ?? emptyForm[k];
    });
    setForm(populated);
    setModalOpen(true);
  }, [emptyForm]);

  const save = useCallback(async (extraValidate) => {
    if (extraValidate) {
      const msg = extraValidate(form, editItem);
      if (msg) return { error: msg };
    }
    setSaving(true);
    try {
      const body = editItem ? { id: editItem.id, ...form } : { ...form };
      const res = await fetch(endpoint, {
        method: editItem ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to save");
      setModalOpen(false);
      await refresh();
      return { success: true };
    } catch (e) {
      return { error: e.message || "Failed to save" };
    } finally {
      setSaving(false);
    }
  }, [editItem, form, endpoint, refresh]);

  const remove = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`${endpoint}?id=${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to delete");
      setDeleteTarget(null);
      await refresh();
      return { success: true };
    } catch (e) {
      return { error: e.message || "Failed to delete" };
    }
  }, [deleteTarget, endpoint, refresh]);

  const toggleActive = useCallback(async (item) => {
    try {
      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, is_active: item.is_active ? 0 : 1 }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to update");
      await refresh();
      return { success: true };
    } catch (e) {
      return { error: e.message || "Failed to update" };
    }
  }, [endpoint, refresh]);

  return {
    items,
    loading,
    error,
    modalOpen,
    setModalOpen,
    editItem,
    deleteTarget,
    setDeleteTarget,
    saving,
    form,
    setForm,
    openAdd,
    openEdit,
    save,
    remove,
    refresh,
    toggleActive,
  };
}
