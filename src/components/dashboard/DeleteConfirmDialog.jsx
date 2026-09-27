"use client";

import React from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  targetLead,
  isBulk = false,
  count = 1,
  onConfirm,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm" onClose={() => onOpenChange(false)}>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <DialogTitle className="text-base text-slate-900">
              {isBulk ? `Delete ${count} Selected Leads?` : `Delete Lead: ${targetLead?.name}?`}
            </DialogTitle>
            <DialogDescription className="mt-1 text-xs text-slate-500 leading-relaxed">
              {isBulk
                ? `Are you sure you want to permanently delete these ${count} leads from Compare Degree? This action will remove their notes, follow-up history, and audit timeline.`
                : `Are you sure you want to delete lead #${targetLead?.id} (${targetLead?.course} - ${targetLead?.college})? This cannot be undone.`}
            </DialogDescription>
          </div>
        </div>

        <DialogFooter className="mt-5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            className="gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Confirm Deletion</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
