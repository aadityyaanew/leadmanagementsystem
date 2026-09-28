"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ id: "", name: "", email: "", password: "" });
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetch("/api/admin/profile")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setForm({
            id: data.admin.id,
            name: data.admin.name,
            email: data.admin.email,
            password: "",
          });
        }
        setLoading(false);
      });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setToast(null);

    try {
      const res = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      
      if (data.success) {
        setToast({ type: "success", msg: "Profile updated successfully!" });
        setForm(p => ({ ...p, password: "" })); // Clear password field after success
      } else {
        setToast({ type: "error", msg: data.error || "Failed to update profile" });
      }
    } catch (err) {
      setToast({ type: "error", msg: "An error occurred." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#FBFBFC]">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="text-xl font-bold text-slate-800">Admin Profile</div>
          </div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Go Back</span>
          </button>
        </div>
      </header>

      <main className="max-w-xl mx-auto py-10 px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Update Profile Information</h2>
          
          {toast && (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl mb-6 text-sm font-medium border ${
              toast.type === "error" ? "bg-red-50 text-red-700 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
            }`}>
              {toast.type === "error" ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
              {toast.msg}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#8B1E1E]/30 focus:border-[#8B1E1E] transition-all text-sm"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
              <input
                type="email"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#8B1E1E]/30 focus:border-[#8B1E1E] transition-all text-sm"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">New Password (leave blank to keep current)</label>
              <input
                type="password"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#8B1E1E]/30 focus:border-[#8B1E1E] transition-all text-sm"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <div className="pt-4">
              <Button type="submit" disabled={saving} className="w-full py-3 bg-[#8B1E1E] hover:bg-[#6d1414] text-white font-semibold rounded-xl disabled:opacity-70">
                {saving ? "Saving Changes..." : "Update Profile"}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
