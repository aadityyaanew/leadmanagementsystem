"use client";

import React, { useState } from "react";
import {
  Phone,
  Mail,
  Send,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";

export function QuickContactModal({
  open,
  onOpenChange,
  lead,
  type = "call", // "call" | "email"
  onLogInteraction,
}) {
  const [callDisposition, setCallDisposition] = useState("Connected - Discussion Done");
  const [callNotes, setCallNotes] = useState("");

  const [emailSubject, setEmailSubject] = useState("Admission Inquiry Update - Compare Degree");
  const [emailBody, setEmailBody] = useState("");

  if (!lead) return null;

  const handleLaunchCall = () => {
    window.open(`tel:${lead.mobile}`, "_self");
  };

  const handleSaveCallLog = () => {
    onLogInteraction?.(lead.id, {
      counsellor: lead.counsellor,
      mode: "Phone Call",
      disposition: callDisposition,
      notes: callNotes,
      outcome: `${callDisposition}: ${callNotes || "Call logged"}`,
    });
    onOpenChange(false);
  };

  const handleSendEmail = () => {
    const body = emailBody || `Hello ${lead.name},\n\nRegarding your application for ${lead.course} at ${lead.college} on Compare Degree...\n\nBest regards,\n${lead.counsellor}\nAdmissions Office\nCompare Degree (Smart Decisions, Brighter Futures)`;
    window.open(`mailto:${lead.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(body)}`, "_blank");
    onLogInteraction?.(lead.id, {
      counsellor: lead.counsellor,
      mode: "Email Follow-up",
      outcome: `Sent email with subject: '${emailSubject}'`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md" onClose={() => onOpenChange(false)}>
        {/* CALL MODE */}
        {type === "call" && (
          <div>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle>Call Candidate: {lead.name}</DialogTitle>
                  <DialogDescription>
                    Phone: <span className="font-mono font-semibold text-slate-800">{lead.mobile}</span>
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 my-2">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 border border-slate-200">
                <span className="text-xs text-slate-600">
                  Click to dial via connected softphone or mobile device:
                </span>
                <Button
                  size="sm"
                  variant="success"
                  onClick={handleLaunchCall}
                  className="gap-1.5 h-8 text-xs font-semibold"
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span>Start Call</span>
                </Button>
              </div>

              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-semibold text-slate-700">
                  Log Call Outcome & Next Action
                </h4>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    Call Disposition
                  </label>
                  <select
                    value={callDisposition}
                    onChange={(e) => setCallDisposition(e.target.value)}
                    className="w-full h-8 rounded-lg border border-slate-300 bg-white px-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#8B1E1E]"
                  >
                    <option value="Connected - Discussion Done">Connected - Discussion Done</option>
                    <option value="Connected - Asked for Callback">Connected - Asked for Callback</option>
                    <option value="Connected - Scheduled Campus Visit">Connected - Scheduled Campus Visit</option>
                    <option value="Ringing - No Answer">Ringing - No Answer</option>
                    <option value="Busy / Call Rejected">Busy / Call Rejected</option>
                    <option value="Wrong Number / Invalid">Wrong Number / Invalid</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    Discussion Summary / Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Candidate discussed fee structure, parents will visit center..."
                    value={callNotes}
                    onChange={(e) => setCallNotes(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#8B1E1E]"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveCallLog}>
                Save Call Log
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* EMAIL MODE */}
        {type === "email" && (
          <div>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-100 text-[#8B1E1E]">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle>Send Email: {lead.name}</DialogTitle>
                  <DialogDescription>
                    To: <span className="font-mono text-slate-800">{lead.email}</span>
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-3 my-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full h-8 rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#8B1E1E]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Email Body
                </label>
                <textarea
                  rows={4}
                  placeholder={`Hello ${lead.name},\n\nWe are pleased to inform you that your application for ${lead.course} has passed initial screening on Compare Degree...`}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-800 leading-relaxed font-sans focus:outline-none focus:ring-1 focus:ring-[#8B1E1E]"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSendEmail}
                className="gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Send / Open Mail Client</span>
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
