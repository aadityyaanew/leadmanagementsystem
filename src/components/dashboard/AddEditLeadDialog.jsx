"use client";

import React, { useState, useEffect } from "react";
import { useLeads } from "@/hooks/useLeads";
import {
  AlertTriangle,
  User,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import {
  COLLEGES,
  COURSES,
  CENTERS,
  COUNSELLORS,
  LEAD_SOURCES,
  LEAD_STATUSES,
} from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export function AddEditLeadDialog({

  open,
  onOpenChange,
  editingLead = null,
  onSave,
  checkDuplicate,
}) {
  const { currentRoleKey } = useLeads();
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    college: COLLEGES[0],
    course: COURSES[0],
    center: CENTERS[0],
    counsellor: COUNSELLORS[0],
    status: "New Lead",
    source: LEAD_SOURCES[0],
    city: "New Delhi",
    notesText: "",
  });

  const [errors, setErrors] = useState({});
  const [duplicateMatch, setDuplicateMatch] = useState(null);

  // Initialize form when editing or opening
  useEffect(() => {
    if (editingLead) {
      setFormData({
        name: editingLead.name || "",
        mobile: editingLead.mobile || "",
        email: editingLead.email || "",
        college: editingLead.college || COLLEGES[0],
        course: editingLead.course || COURSES[0],
        center: editingLead.center || CENTERS[0],
        counsellor: editingLead.counsellor || COUNSELLORS[0],
        status: editingLead.status || "New Lead",
        source: editingLead.source || LEAD_SOURCES[0],
        city: editingLead.city || "New Delhi",
        notesText: "",
      });
      setDuplicateMatch(null);
    } else {
      setFormData({
        name: "",
        mobile: "+91 ",
        email: "",
        college: COLLEGES[0],
        course: COURSES[0],
        center: CENTERS[0],
        counsellor: COUNSELLORS[0],
        status: "New Lead",
        source: LEAD_SOURCES[0],
        city: "New Delhi",
        notesText: "",
      });
      setDuplicateMatch(null);
    }
    setErrors({});
  }, [editingLead, open]);

  // Real-time duplicate check when mobile or email changes
  useEffect(() => {
    if (!open || editingLead) return;

    if (formData.mobile.length >= 10 || (formData.email && formData.email.includes("@"))) {
      const result = checkDuplicate(formData.mobile, formData.email, editingLead?.id);
      if (result.isDuplicate) {
        setDuplicateMatch(result);
      } else {
        setDuplicateMatch(null);
      }
    } else {
      setDuplicateMatch(null);
    }
  }, [formData.mobile, formData.email, checkDuplicate, open, editingLead]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = "Student name is required";
    if (!formData.mobile.trim() || formData.mobile.replace(/[^0-9]/g, "").length < 10) {
      errs.mobile = "Valid 10-digit mobile number is required";
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      errs.email = "Valid email address is required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    if (duplicateMatch && duplicateMatch.isDuplicate && !isEditing) {
      return;
    }

    const payload = {
      ...formData,
      ...(formData.notesText.trim()
        ? {
            notes: [
              {
                id: "note-" + Date.now(),
                author: formData.counsellor || "Compare Degree Admissions Desk",
                date: new Date().toISOString(),
                text: formData.notesText.trim(),
              },
            ],
          }
        : {}),
    };

    onSave(payload);
    onOpenChange(false);
  };

  const isEditing = Boolean(editingLead);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl" onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>
              {isEditing ? `Edit Lead: ${editingLead.name}` : "Punch New Student Lead"}
            </DialogTitle>
            {!isEditing && (
              <Badge variant="brand" className="text-[10px]">
                Compare Degree Duplicate Check Active
              </Badge>
            )}
          </div>
          <DialogDescription>
            {isEditing
              ? "Update candidate information, assigned counsellor, center, and admission status."
              : "Register an authentic student inquiry. System will automatically check for matching records."}
          </DialogDescription>
        </DialogHeader>

        {/* Realtime Duplicate Alert Banner */}
        {duplicateMatch && duplicateMatch.isDuplicate && !isEditing && (
          <div className="mb-4 rounded-xl border border-rose-300 bg-rose-50/90 p-3.5 text-rose-900 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start gap-3">
              <div className="p-1 rounded-md bg-rose-200 text-rose-900 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="text-xs">
                <div className="font-semibold text-sm flex items-center gap-1.5">
                  <span>Duplicate Lead Detected ({duplicateMatch.matchType.toUpperCase()} MATCH)</span>
                  <Badge variant="error" className="text-[10px] py-0 font-semibold bg-rose-200 text-rose-800">
                    Not Allowed
                  </Badge>
                </div>
                <p className="mt-1 leading-relaxed text-rose-900">
                  Matches existing candidate{" "}
                  <strong>{duplicateMatch.matchedLead.name}</strong> (
                  <span className="font-mono">{duplicateMatch.matchedLead.id}</span>), punched on{" "}
                  <strong>{formatDate(duplicateMatch.matchedLead.punchDate)}</strong>.
                </p>
                <p className="text-[11px] text-rose-800 mt-1">
                  You cannot add a duplicate lead to the system.
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Student Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Student Full Name <span className="text-rose-600">*</span>
              </label>
              <Input
                placeholder="e.g. Aarav Sharma"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                error={errors.name}
                startIcon={User}
              />
              {errors.name && (
                <p className="text-rose-600 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            {/* City */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Student City / Location
              </label>
              <Input
                placeholder="e.g. New Delhi, Bengaluru, Mumbai"
                value={formData.city}
                onChange={(e) => handleChange("city", e.target.value)}
                startIcon={MapPin}
              />
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mobile Number <span className="text-rose-600">*</span>
              </label>
              <Input
                placeholder="+91 98765 43210"
                value={formData.mobile}
                onChange={(e) => handleChange("mobile", e.target.value)}
                error={errors.mobile}
                startIcon={Phone}
              />
              {errors.mobile && (
                <p className="text-rose-600 text-xs mt-1">{errors.mobile}</p>
              )}
            </div>

            {/* Email ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address <span className="text-rose-600">*</span>
              </label>
              <Input
                type="email"
                placeholder="student@example.com"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                error={errors.email}
                startIcon={Mail}
              />
              {errors.email && (
                <p className="text-rose-600 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* College */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Preferred College / University
              </label>
              <Select
                value={formData.college}
                onChange={(e) => handleChange("college", e.target.value)}
              >
                {COLLEGES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>

            {/* Course */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Academic Course
              </label>
              <Select
                value={formData.course}
                onChange={(e) => handleChange("course", e.target.value)}
              >
                {COURSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>

            {/* Center */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unit Name
              </label>
              <Select
                value={formData.center}
                onChange={(e) => handleChange("center", e.target.value)}
              >
                {CENTERS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>

            {/* Counsellor */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assigned Counsellor
              </label>
              <Select
                value={formData.counsellor}
                onChange={(e) => handleChange("counsellor", e.target.value)}
              >
                {COUNSELLORS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>

            {/* Lead Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lead Status
              </label>
              <Select
                value={formData.status}
                onChange={(e) => handleChange("status", e.target.value)}
              >
                {Object.values(LEAD_STATUSES).filter(s => !(s.adminOnly && currentRoleKey === "COUNSELLOR")).map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.label}
                  </option>
                ))}
              </Select>
            </div>

            {/* Batch */}

            {/* Lead Source */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lead Acquisition Source
              </label>
              <Select
                value={formData.source}
                onChange={(e) => handleChange("source", e.target.value)}
              >
                {LEAD_SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>

            {/* Initial Note (for Add mode) */}
            {!isEditing && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Initial Counsellor Remark / Notes
                </label>
                <Input
                  placeholder="e.g. Student seeking merit scholarship details"
                  value={formData.notesText}
                  onChange={(e) => handleChange("notesText", e.target.value)}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="default" className="gap-1.5 font-semibold" disabled={duplicateMatch && duplicateMatch.isDuplicate && !isEditing}>
              {isEditing ? "Save Changes" : "Punch Primary Lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
