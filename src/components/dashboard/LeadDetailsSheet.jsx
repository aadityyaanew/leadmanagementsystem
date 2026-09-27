"use client";

import React, { useState } from "react";
import {
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  Clock,
  Sparkles,
  Copy,
  Edit2,
  Trash2,
  Plus,
  Send,
  ExternalLink,
  AlertTriangle,
  Activity,
} from "lucide-react";
import { Sheet, SheetHeader, SheetTitle, SheetDescription, SheetContent, SheetFooter } from "@/components/ui/Sheet";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ADMISSION_STATUSES, COUNSELLORS, getAdmissionStatus } from "@/lib/constants";
import { formatDate, formatRelativeTime, getInitials, cn } from "@/lib/utils";

export function LeadDetailsSheet({
  lead,
  open,
  onOpenChange,
  onEditLead,
  onDeleteLead,
  onStatusChange,
  onCounsellorChange,
  onAddFollowUp,
  onAddNote,
  onQuickContact,
  onViewRelatedLead,
  canDelete,
  canAssignCounsellor,
  allLeads = [],
}) {
  const [activeTab, setActiveTab] = useState("overview");

  // New follow-up form state
  const [showAddFollowUp, setShowAddFollowUp] = useState(false);
  const [followUpMode, setFollowUpMode] = useState("Phone Call");
  const [followUpOutcome, setFollowUpOutcome] = useState("");
  const [followUpNextDate, setFollowUpNextDate] = useState("");
  const [followUpStatusUpdate, setFollowUpStatusUpdate] = useState("");

  // New note form state
  const [newNoteText, setNewNoteText] = useState("");

  if (!lead) return null;

  const statusMeta = getAdmissionStatus(lead.status);
  const isDuplicate = lead.leadType === "Duplicate";

  // Find linked primary lead if this is duplicate
  const primaryLead = isDuplicate && lead.duplicateOfId
    ? allLeads.find((l) => l.id === lead.duplicateOfId)
    : null;

  // Find duplicate leads if this is primary
  const relatedDuplicates = !isDuplicate
    ? allLeads.filter((l) => l.duplicateOfId === lead.id)
    : [];

  const handleSaveFollowUp = (e) => {
    e.preventDefault();
    if (!followUpOutcome.trim()) return;

    onAddFollowUp(lead.id, {
      counsellor: lead.counsellor,
      mode: followUpMode,
      outcome: followUpOutcome.trim(),
      scheduledNext: followUpNextDate || null,
      updateStatusTo: followUpStatusUpdate || undefined,
    });

    setFollowUpOutcome("");
    setFollowUpNextDate("");
    setFollowUpStatusUpdate("");
    setShowAddFollowUp(false);
  };

  const handleSaveNote = (e) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    onAddNote(lead.id, newNoteText.trim());
    setNewNoteText("");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {/* Header */}
      <SheetHeader onClose={() => onOpenChange(false)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 font-bold text-[#8B1E1E] border border-rose-200 text-base">
              {getInitials(lead.name)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <SheetTitle>{lead.name}</SheetTitle>
                {isDuplicate ? (
                  <Badge variant="warning" className="gap-1 text-[11px]">
                    <Copy className="h-3 w-3" /> Duplicate Lead
                  </Badge>
                ) : (
                  <Badge variant="brand" className="gap-1 text-[11px]">
                    <Sparkles className="h-3 w-3" /> Primary Lead
                  </Badge>
                )}
              </div>
              <SheetDescription className="font-mono">
                ID: {lead.id} • Punched on {formatDate(lead.punchDate)} ({formatRelativeTime(lead.punchDate)})
              </SheetDescription>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons Bar */}
        <div className="mt-3.5 flex flex-wrap items-center gap-2 pt-3 border-t border-slate-200/80">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onQuickContact(lead, "call")}
            className="gap-1.5 h-8 text-xs text-emerald-700 hover:bg-emerald-50"
          >
            <Phone className="h-3.5 w-3.5" />
            <span>Call</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onQuickContact(lead, "whatsapp")}
            className="gap-1.5 h-8 text-xs text-green-700 hover:bg-green-50"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>WhatsApp</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onQuickContact(lead, "email")}
            className="gap-1.5 h-8 text-xs text-[#8B1E1E] hover:bg-rose-50"
          >
            <Mail className="h-3.5 w-3.5" />
            <span>Email</span>
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              onEditLead(lead);
              onOpenChange(false);
            }}
            className="gap-1.5 h-8 text-xs ml-auto font-medium"
          >
            <Edit2 className="h-3.5 w-3.5" />
            <span>Edit Lead</span>
          </Button>
        </div>
      </SheetHeader>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-200 px-6 bg-slate-50/70 text-xs font-medium">
        <button
          onClick={() => setActiveTab("overview")}
          className={cn(
            "py-2.5 px-3 border-b-2 font-semibold transition-colors",
            activeTab === "overview"
              ? "border-[#8B1E1E] text-[#8B1E1E]"
              : "border-transparent text-slate-500 hover:text-slate-900"
          )}
        >
          Overview & Academics
        </button>

        <button
          onClick={() => setActiveTab("followups")}
          className={cn(
            "py-2.5 px-3 border-b-2 font-semibold transition-colors flex items-center gap-1.5",
            activeTab === "followups"
              ? "border-[#8B1E1E] text-[#8B1E1E]"
              : "border-transparent text-slate-500 hover:text-slate-900"
          )}
        >
          <span>Follow-ups</span>
          {lead.followUps?.length > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700">
              {lead.followUps.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("timeline")}
          className={cn(
            "py-2.5 px-3 border-b-2 font-semibold transition-colors flex items-center gap-1.5",
            activeTab === "timeline"
              ? "border-[#8B1E1E] text-[#8B1E1E]"
              : "border-transparent text-slate-500 hover:text-slate-900"
          )}
        >
          <span>Audit Timeline</span>
          {lead.timeline?.length > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700">
              {lead.timeline.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("notes")}
          className={cn(
            "py-2.5 px-3 border-b-2 font-semibold transition-colors flex items-center gap-1.5",
            activeTab === "notes"
              ? "border-[#8B1E1E] text-[#8B1E1E]"
              : "border-transparent text-slate-500 hover:text-slate-900"
          )}
        >
          <span>Notes</span>
          {lead.notes?.length > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700">
              {lead.notes.length}
            </span>
          )}
        </button>
      </div>

      {/* Content Area */}
      <SheetContent>
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-5">
            {/* Duplicate Notice Banner */}
            {isDuplicate && (
              <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-3.5 text-amber-900">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <div className="font-semibold text-sm">Duplicate Lead Record</div>
                    <p className="mt-1">
                      This lead was flagged as a duplicate because another student inquiry already exists with this mobile number (<strong>{lead.mobile}</strong>) or email.
                    </p>
                    {primaryLead ? (
                      <div className="mt-2.5 flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onViewRelatedLead(primaryLead)}
                          className="h-7 text-xs border-amber-300 bg-white text-amber-900 gap-1.5 font-medium"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>View Primary Lead #{primaryLead.id}</span>
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-2 font-mono text-[11px] text-amber-700">
                        Primary Lead ID: #{lead.duplicateOfId || "Original"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* If Primary lead and has duplicates, show duplicate inquiries history */}
            {!isDuplicate && relatedDuplicates.length > 0 && (
              <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3.5 text-[#8B1E1E]">
                <div className="flex items-start gap-2.5">
                  <Copy className="h-5 w-5 text-[#8B1E1E] shrink-0 mt-0.5" />
                  <div className="text-xs w-full">
                    <div className="font-semibold text-sm">
                      {relatedDuplicates.length} Duplicate Inquiries Captured
                    </div>
                    <p className="mt-0.5 text-slate-600">
                      The candidate submitted repeat inquiries on Compare Degree that were linked to this primary profile.
                    </p>
                    <div className="mt-2 space-y-1.5">
                      {relatedDuplicates.map((dup) => (
                        <div
                          key={dup.id}
                          className="flex items-center justify-between rounded-lg bg-white p-2 text-xs border border-rose-100 shadow-2xs"
                        >
                          <div>
                            <span className="font-mono font-semibold text-slate-800">
                              {dup.id}
                            </span>
                            <span className="text-slate-400 mx-1.5">•</span>
                            <span className="text-slate-600">
                              via {dup.source} on {formatDate(dup.punchDate)}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onViewRelatedLead(dup)}
                            className="h-6 text-[11px] px-2 text-[#8B1E1E] font-medium"
                          >
                            View
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Admission Status Selector Card */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                Current Admission Status
              </label>
              <div className="flex items-center gap-3">
                <select
                  value={lead.status}
                  onChange={(e) => onStatusChange(lead.id, e.target.value)}
                  className="flex-1 h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#8B1E1E]"
                >
                  {Object.values(ADMISSION_STATUSES).map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.label} — {status.description}
                    </option>
                  ))}
                </select>
                <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold border", statusMeta.bg, statusMeta.color, statusMeta.border)}>
                  {lead.status}
                </span>
              </div>
            </div>

            {/* Core Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Contact Information */}
              <div className="rounded-xl border border-slate-200 p-4 bg-white shadow-2xs">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Contact Information
                </h4>
                <div className="space-y-2.5 text-xs">
                  <div>
                    <span className="text-slate-500 block">Mobile Number:</span>
                    <span className="font-mono font-medium text-slate-900 text-sm">
                      {lead.mobile}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Email Address:</span>
                    <span className="font-medium text-slate-900">
                      {lead.email}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">City / Location:</span>
                    <span className="font-medium text-slate-900">
                      {lead.city || "Not specified"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Academic Preferences */}
              <div className="rounded-xl border border-slate-200 p-4 bg-white shadow-2xs">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Academic Preferences
                </h4>
                <div className="space-y-2.5 text-xs">
                  <div>
                    <span className="text-slate-500 block">Preferred College:</span>
                    <span className="font-semibold text-slate-900">
                      {lead.college}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Target Course:</span>
                    <span className="font-medium text-slate-900">
                      {lead.course}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Intake Batch:</span>
                    <span className="font-mono font-medium text-slate-900">
                      {lead.batch}
                    </span>
                  </div>
                </div>
              </div>

              {/* Assignment & Center */}
              <div className="rounded-xl border border-slate-200 p-4 bg-white shadow-2xs">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Centre & Counsellor
                </h4>
                <div className="space-y-2.5 text-xs">
                  <div>
                    <span className="text-slate-500 block">Unit Name:</span>
                    <span className="font-medium text-slate-900">
                      {lead.center}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Assigned Counsellor:</span>
                    {canAssignCounsellor ? (
                      <select
                        value={lead.counsellor}
                        onChange={(e) => onCounsellorChange(lead.id, e.target.value)}
                        className="mt-1 h-7 rounded border border-slate-300 bg-white px-2 text-xs font-medium text-slate-800"
                      >
                        {COUNSELLORS.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.name} ({c.center})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="font-medium text-slate-900">
                        {lead.counsellor}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Punching Details */}
              <div className="rounded-xl border border-slate-200 p-4 bg-white shadow-2xs">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Punching & Source
                </h4>
                <div className="space-y-2.5 text-xs">
                  <div>
                    <span className="text-slate-500 block">Punching Date & Time:</span>
                    <span className="font-medium text-slate-900">
                      {formatDate(lead.punchDate)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Acquisition Source:</span>
                    <span className="font-medium text-slate-900">
                      {lead.source}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Assessment Score:</span>
                    <span className="font-mono font-medium text-slate-900">
                      {lead.score ? `${lead.score} / 100` : "Evaluation Pending"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FOLLOW-UPS TAB */}
        {activeTab === "followups" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Scheduled & Past Follow-ups
                </h3>
                <p className="text-xs text-slate-500">
                  Track candidate consultations and schedule next outreach
                </p>
              </div>
              <Button
                size="sm"
                variant={showAddFollowUp ? "secondary" : "default"}
                onClick={() => setShowAddFollowUp(!showAddFollowUp)}
                className="gap-1.5 text-xs font-medium"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{showAddFollowUp ? "Cancel" : "Add Follow-up"}</span>
              </Button>
            </div>

            {/* Add Follow-up Form */}
            {showAddFollowUp && (
              <form
                onSubmit={handleSaveFollowUp}
                className="rounded-xl border border-rose-200 bg-rose-50/30 p-4 space-y-3 animate-in fade-in"
              >
                <h4 className="text-xs font-semibold text-[#8B1E1E]">
                  Log New Follow-up
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Interaction Mode
                    </label>
                    <select
                      value={followUpMode}
                      onChange={(e) => setFollowUpMode(e.target.value)}
                      className="w-full h-8 rounded-lg border border-slate-300 bg-white px-2 text-xs text-slate-800"
                    >
                      <option value="Phone Call">Phone Call</option>
                      <option value="WhatsApp Chat">WhatsApp Chat</option>
                      <option value="In-Person Campus Visit">In-Person Campus Visit</option>
                      <option value="Video Consultation">Video Consultation</option>
                      <option value="Email Follow-up">Email Follow-up</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Next Follow-up Date (Optional)
                    </label>
                    <Input
                      type="date"
                      value={followUpNextDate}
                      onChange={(e) => setFollowUpNextDate(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Discussion Summary / Outcome <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Candidate discussed eligibility and fee schedule..."
                    value={followUpOutcome}
                    onChange={(e) => setFollowUpOutcome(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Update Admission Status to:
                  </label>
                  <select
                    value={followUpStatusUpdate}
                    onChange={(e) => setFollowUpStatusUpdate(e.target.value)}
                    className="w-full h-8 rounded-lg border border-slate-300 bg-white px-2 text-xs text-slate-800"
                  >
                    <option value="">Keep current status ({lead.status})</option>
                    {Object.values(ADMISSION_STATUSES).map((status) => (
                      <option key={status.id} value={status.id}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAddFollowUp(false)}
                    className="h-8 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="h-8 text-xs">
                    Save Follow-up
                  </Button>
                </div>
              </form>
            )}

            {/* Follow-up list */}
            {lead.followUps?.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No follow-ups recorded yet for this candidate.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lead.followUps?.map((fu) => (
                  <div
                    key={fu.id}
                    className="rounded-xl border border-slate-200 p-3.5 bg-white text-xs shadow-2xs"
                  >
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="brand" className="font-semibold text-[11px]">
                          {fu.mode}
                        </Badge>
                        <span className="font-medium text-slate-700">by {fu.counsellor}</span>
                      </div>
                      <span className="text-[11px]">{formatDate(fu.date)}</span>
                    </div>
                    <p className="text-slate-800 font-medium mt-1 leading-relaxed">
                      {fu.outcome}
                    </p>
                    {fu.scheduledNext && (
                      <div className="mt-2 flex items-center gap-1.5 text-[#8B1E1E] font-medium text-[11px]">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Next Follow-up Scheduled: {formatDate(fu.scheduledNext)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TIMELINE TAB */}
        {activeTab === "timeline" && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Activity Audit Trail
              </h3>
              <p className="text-xs text-slate-500">
                Complete event log from punch date to current status
              </p>
            </div>

            <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {lead.timeline?.map((item, idx) => (
                <div key={idx} className="relative group">
                  {/* Timeline Node Dot */}
                  <div className="absolute -left-6 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 ring-4 ring-white text-[#8B1E1E]">
                    <Activity className="h-2.5 w-2.5" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-semibold text-slate-900">
                        {item.event}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatDate(item.date)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      {item.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NOTES TAB */}
        {activeTab === "notes" && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Internal Counsellor Notes
              </h3>
              <p className="text-xs text-slate-500">
                Private notes visible to counsellors, managers, and admissions directors
              </p>
            </div>

            {/* Note Composer */}
            <form onSubmit={handleSaveNote} className="space-y-2">
              <textarea
                rows={3}
                required
                placeholder="Write internal consultation notes or parent feedback..."
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-800 shadow-2xs placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#8B1E1E]"
              />
              <div className="flex justify-end">
                <Button type="submit" size="sm" className="gap-1.5 h-8 text-xs font-semibold">
                  <Send className="h-3 w-3" />
                  <span>Post Note</span>
                </Button>
              </div>
            </form>

            {/* Notes list */}
            {lead.notes?.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                No notes logged yet. Add one above.
              </div>
            ) : (
              <div className="space-y-2.5">
                {lead.notes?.map((n) => (
                  <div
                    key={n.id}
                    className="rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-2xs"
                  >
                    <div className="flex items-center justify-between text-slate-400 mb-1 text-[11px]">
                      <span className="font-semibold text-slate-800">
                        {n.author}
                      </span>
                      <span>{formatDate(n.date)}</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed font-normal">
                      {n.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </SheetContent>

      {/* Footer */}
      <SheetFooter>
        {canDelete && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              onDeleteLead(lead);
              onOpenChange(false);
            }}
            className="gap-1.5 h-8 text-xs mr-auto"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete Record</span>
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onOpenChange(false)}
          className="h-8 text-xs"
        >
          Close Panel
        </Button>
      </SheetFooter>
    </Sheet>
  );
}
