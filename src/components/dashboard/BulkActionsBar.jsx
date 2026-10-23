"use client";

import React from "react";
import { useLeads } from "@/hooks/useLeads";
import {
  ChevronDown,
  Trash2,
  Download,
  X,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DropdownMenu, DropdownMenuItem, DropdownMenuLabel } from "@/components/ui/Dropdown";
import { LEAD_STATUSES, COUNSELLORS } from "@/lib/constants";

export function BulkActionsBar({
  selectedIds,
  onClearSelection,
  onBulkStatusChange,
  onBulkAssignCounsellor,
  onBulkDelete,
  onExportSelected,
  canDelete,
  canAssign,
}) {
  const { currentRoleKey } = useLeads();
  const [counsellorOptions, setCounsellorOptions] = React.useState(COUNSELLORS);

  React.useEffect(() => {
    fetch("/api/crm/options")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.counsellors) && data.counsellors.length > 0) {
          setCounsellorOptions(data.counsellors);
        }
      })
      .catch(() => {});
  }, []);

  if (!selectedIds || selectedIds.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/95 backdrop-blur-md px-4 py-2 text-white shadow-2xl ring-1 ring-white/10 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="flex items-center gap-2 pr-3 border-r border-slate-700/80">
        <span className="flex h-5 min-w-5 px-1.5 items-center justify-center rounded-full bg-[#8B1E1E] text-[11px] font-bold text-white shadow-xs">
          {selectedIds.length}
        </span>
        <span className="text-xs font-medium text-slate-300">Selected</span>
      </div>

      {/* Quick Status Update */}
      <DropdownMenu
        side="top"
        align="left"
        className="max-h-72 overflow-y-auto mb-2"
        trigger={
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-slate-200 hover:text-white hover:bg-slate-800 gap-1.5 h-8 font-medium"
          >
            <span>Update Status</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </Button>
        }
      >
        <DropdownMenuLabel>Set Status for {selectedIds.length} leads</DropdownMenuLabel>
        {Object.values(LEAD_STATUSES).filter(s => !(s.adminOnly && currentRoleKey === "COUNSELLOR")).map((status) => (
          <DropdownMenuItem
            key={status.id}
            onClick={() => onBulkStatusChange(status.id)}
            className="gap-2"
          >
            <span className={`h-2 w-2 rounded-full ${status.dot}`} />
            <span>{status.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenu>

      {/* Bulk Assign Counsellor */}
      {canAssign && (
        <DropdownMenu
          side="top"
          align="left"
          className="max-h-72 overflow-y-auto mb-2"
          trigger={
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-slate-200 hover:text-white hover:bg-slate-800 gap-1.5 h-8 font-medium"
            >
              <UserCheck className="h-3.5 w-3.5 text-slate-400" />
              <span>Assign Counsellor</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </Button>
          }
        >
          <DropdownMenuLabel>Assign {selectedIds.length} leads to</DropdownMenuLabel>
          {counsellorOptions.map((c) => (
            <DropdownMenuItem
              key={c}
              onClick={() => onBulkAssignCounsellor(c)}
            >
              <span>{c}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenu>
      )}

      {/* Export Selected */}
      {currentRoleKey === "ADMIN" && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onExportSelected}
          className="text-xs text-slate-200 hover:text-white hover:bg-slate-800 gap-1.5 h-8 font-medium"
        >
          <Download className="h-3.5 w-3.5 text-slate-400" />
          <span>Export</span>
        </Button>
      )}

      {/* Delete (if role permits) */}
      {canDelete && (
        <Button
          variant="destructive"
          size="sm"
          onClick={onBulkDelete}
          className="text-xs gap-1.5 h-8 font-medium"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Delete</span>
        </Button>
      )}

      {/* Clear Selection */}
      <button
        onClick={onClearSelection}
        className="ml-2 rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        title="Deselect all"
        aria-label="Clear selection"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
