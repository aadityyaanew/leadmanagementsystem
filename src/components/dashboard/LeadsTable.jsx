"use client";

import React from "react";
import { useLeads } from "@/hooks/useLeads";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Phone,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Eye,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Sparkles,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Tooltip } from "@/components/ui/Tooltip";
import { DropdownMenu, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/Dropdown";
import { LEAD_STATUSES, COUNSELLORS, getLeadStatus } from "@/lib/constants";
import { formatDate, formatRelativeTime, getInitials, cn } from "@/lib/utils";

export function LeadsTable({

  leads,
  columnsVisibility,
  density = "default",
  sortConfig,
  onSort,
  selectedIds,
  onToggleSelectRow,
  onToggleSelectAll,
  onViewLead,
  onEditLead,
  onDeleteLead,
  onQuickStatusChange,
  onQuickCounsellorChange,
  onQuickContact,
  canDelete,
  canAssignCounsellor,
  // Pagination
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
}) {
  const { currentRoleKey } = useLeads();
  const allPageIds = leads.map((l) => l.id);
  const isAllSelected = allPageIds.length > 0 && allPageIds.every((id) => selectedIds.includes(id));
  const isSomeSelected = allPageIds.some((id) => selectedIds.includes(id)) && !isAllSelected;

  // Density padding configs
  const densityStyles = {
    compact: "py-2 px-3 text-xs",
    default: "py-3 px-3.5 text-xs sm:text-sm",
    relaxed: "py-4 px-4 text-sm",
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="h-3 w-3 text-slate-400 group-hover:text-slate-700" />;
    }
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="h-3 w-3 text-[#8B1E1E] font-bold" />
    ) : (
      <ArrowDown className="h-3 w-3 text-[#8B1E1E] font-bold" />
    );
  };

  const totalPages = Math.ceil(leads.length / pageSize) || 1;
  const paginatedLeads = leads.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, leads.length);

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden flex flex-col">
      {/* Table Scrollable Container */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-700 text-xs font-semibold tracking-wide uppercase">
              {/* Checkbox */}
              <th className="py-3 px-3.5 w-10 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = isSomeSelected;
                  }}
                  onChange={() => onToggleSelectAll(allPageIds)}
                  className="h-4 w-4 rounded border-slate-300 text-[#8B1E1E] focus:ring-[#8B1E1E] cursor-pointer"
                  aria-label="Select all on current view"
                />
              </th>

              {/* Lead Name */}
              {columnsVisibility.name && (
                <th
                  onClick={() => onSort("name")}
                  className="py-3 px-3.5 cursor-pointer hover:bg-slate-100/70 transition-colors group select-none min-w-[170px]"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Lead Name</span>
                    {getSortIcon("name")}
                  </div>
                </th>
              )}

              {/* Lead Punching Date & Time */}
              {columnsVisibility.punchDate && (
                <th
                  onClick={() => onSort("punchDate")}
                  className="py-3 px-3.5 cursor-pointer hover:bg-slate-100/70 transition-colors group select-none min-w-[160px]"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Punching Date & Time</span>
                    {getSortIcon("punchDate")}
                  </div>
                </th>
              )}

              {/* Mobile Number */}
              {columnsVisibility.mobile && (
                <th className="py-3 px-3.5 min-w-[140px]">Mobile Number</th>
              )}

              {/* Email ID */}
              {columnsVisibility.email && (
                <th className="py-3 px-3.5 min-w-[170px]">Email ID</th>
              )}

              {/* College */}
              {columnsVisibility.college && (
                <th
                  onClick={() => onSort("college")}
                  className="py-3 px-3.5 cursor-pointer hover:bg-slate-100/70 transition-colors group select-none min-w-[150px]"
                >
                  <div className="flex items-center gap-1.5">
                    <span>College</span>
                    {getSortIcon("college")}
                  </div>
                </th>
              )}

              {/* Course */}
              {columnsVisibility.course && (
                <th
                  onClick={() => onSort("course")}
                  className="py-3 px-3.5 cursor-pointer hover:bg-slate-100/70 transition-colors group select-none min-w-[160px]"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Course</span>
                    {getSortIcon("course")}
                  </div>
                </th>
              )}

              {/* Lead Type (Primary / Duplicate) */}
              {columnsVisibility.leadType && (
                <th
                  onClick={() => onSort("leadType")}
                  className="py-3 px-3.5 cursor-pointer hover:bg-slate-100/70 transition-colors group select-none text-center min-w-[110px]"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Lead Type</span>
                    {getSortIcon("leadType")}
                  </div>
                </th>
              )}

              {/* Unit Name */}
              {columnsVisibility.center && (
                <th className="py-3 px-3.5 min-w-[140px]">Unit Name</th>
              )}

              {/* Counsellor Name */}
              {columnsVisibility.counsellor && (
                <th
                  onClick={() => onSort("counsellor")}
                  className="py-3 px-3.5 cursor-pointer hover:bg-slate-100/70 transition-colors group select-none min-w-[140px]"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Counsellor</span>
                    {getSortIcon("counsellor")}
                  </div>
                </th>
              )}

              {/* Lead Status */}
              {columnsVisibility.status && (
                <th
                  onClick={() => onSort("status")}
                  className="py-3 px-3.5 cursor-pointer hover:bg-slate-100/70 transition-colors group select-none min-w-[140px]"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Lead Status</span>
                    {getSortIcon("status")}
                  </div>
                </th>
              )}

              {/* Actions Header */}
              <th className="py-3 px-3.5 text-right w-24">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {paginatedLeads.length === 0 ? (
              <tr>
                <td
                  colSpan={14}
                  className="py-12 text-center text-slate-500"
                >
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-[#8B1E1E] mb-3">
                      <GraduationCap className="h-6 w-6" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-800">
                      No matching leads found
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Try adjusting search query or clearing active filters to see all student records.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedLeads.map((lead) => {
                const isSelected = selectedIds.includes(lead.id);
                const statusMeta = getLeadStatus(lead.status);
                const isDuplicate = lead.leadType === "Duplicate";

                return (
                  <tr
                    key={lead.id}
                    className={cn(
                      "group transition-colors hover:bg-slate-50/90",
                      isSelected && "bg-rose-50/35"
                    )}
                  >
                    {/* Row Select Checkbox */}
                    <td className={cn(densityStyles[density], "text-center")}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelectRow(lead.id)}
                        className="h-4 w-4 rounded border-slate-300 text-[#8B1E1E] focus:ring-[#8B1E1E] cursor-pointer"
                        aria-label={`Select ${lead.name}`}
                      />
                    </td>

                    {/* Lead Name with Initials & ID */}
                    {columnsVisibility.name && (
                      <td className={densityStyles[density]}>
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-50 font-bold text-xs text-[#8B1E1E] border border-rose-100">
                            {getInitials(lead.name)}
                          </div>
                          <div className="min-w-0">
                            <button
                              onClick={() => onViewLead(lead)}
                              className="font-semibold text-slate-900 hover:text-[#8B1E1E] text-left truncate block max-w-[180px] transition-colors"
                            >
                              {lead.name}
                            </button>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                              <span>{lead.id}</span>
                              {lead.source && (
                                <>
                                  <span>•</span>
                                  <span className="truncate max-w-[100px]">{lead.source}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    )}

                    {/* Lead Punching Date & Time */}
                    {columnsVisibility.punchDate && (
                      <td className={densityStyles[density]}>
                        <div className="text-slate-800 font-medium">
                          {formatDate(lead.punchDate)}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {formatRelativeTime(lead.punchDate)}
                        </div>
                      </td>
                    )}

                    {/* Mobile Number with Call & WhatsApp triggers */}
                    {columnsVisibility.mobile && (
                      <td className={densityStyles[density]}>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-slate-800 font-medium">
                            {lead.mobile}
                          </span>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            <button
                              onClick={() => onQuickContact(lead, "call")}
                              className="p-1 rounded text-slate-400 hover:text-emerald-700 hover:bg-emerald-50"
                              title="Call candidate"
                            >
                              <Phone className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => onQuickContact(lead, "whatsapp")}
                              className="p-1 rounded text-slate-400 hover:text-green-700 hover:bg-green-50"
                              title="Message on WhatsApp"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </td>
                    )}

                    {/* Email ID with Mail trigger */}
                    {columnsVisibility.email && (
                      <td className={densityStyles[density]}>
                        <div className="flex items-center gap-1.5 max-w-[200px]">
                          <span className="truncate text-slate-600">
                            {lead.email}
                          </span>
                          <button
                            onClick={() => onQuickContact(lead, "email")}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-slate-400 hover:text-[#8B1E1E] hover:bg-rose-50 shrink-0"
                            title="Compose Email"
                          >
                            <Mail className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    )}

                    {/* College */}
                    {columnsVisibility.college && (
                      <td className={densityStyles[density]}>
                        <div className="text-slate-900 font-medium truncate max-w-[160px]">
                          {lead.college}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[160px]">
                          {lead.city || "India"}
                        </div>
                      </td>
                    )}

                    {/* Course */}
                    {columnsVisibility.course && (
                      <td className={densityStyles[density]}>
                        <div className="text-slate-800 truncate max-w-[170px] font-medium">
                          {lead.course}
                        </div>
                      </td>
                    )}

                    {/* Lead Type (Primary / Duplicate) */}
                    {columnsVisibility.leadType && (
                      <td className={cn(densityStyles[density], "text-center")}>
                        {isDuplicate ? (
                          <Tooltip
                            content={
                              lead.duplicateOfId
                                ? `Duplicate inquiry of #${lead.duplicateOfId}`
                                : "Repeat lead with matching phone/email"
                            }
                          >
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                              <Copy className="h-3 w-3" />
                              <span>Duplicate</span>
                            </span>
                          </Tooltip>
                        ) : (
                          <div className="inline-flex items-center gap-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-[#8B1E1E] border border-rose-200">
                              <Sparkles className="h-3 w-3" />
                              <span>Primary</span>
                            </span>
                            {lead.duplicateCount > 0 && (
                              <Tooltip content={`${lead.duplicateCount} duplicate inquiry recorded`}>
                                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700">
                                  {lead.duplicateCount}
                                </span>
                              </Tooltip>
                            )}
                          </div>
                        )}
                      </td>
                    )}

                    {/* Unit Name */}
                    {columnsVisibility.center && (
                      <td className={densityStyles[density]}>
                        <div className="text-slate-700 truncate max-w-[150px]">
                          {lead.center}
                        </div>
                      </td>
                    )}

                    {/* Counsellor Name */}
                    {columnsVisibility.counsellor && (
                      <td className={densityStyles[density]}>
                        {canAssignCounsellor ? (
                          <DropdownMenu
                            trigger={
                              <button
                                type="button"
                                className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-slate-700 hover:bg-slate-100 transition-colors"
                              >
                                <div className="h-5 w-5 rounded-full bg-rose-50 text-[#8B1E1E] border border-rose-200/50 flex items-center justify-center text-[10px] font-bold">
                                  {getInitials(lead.counsellor)}
                                </div>
                                <span className="truncate max-w-[110px] font-medium text-slate-800">
                                  {lead.counsellor}
                                </span>
                              </button>
                            }
                          >
                            <DropdownMenuLabel>Reassign Counsellor</DropdownMenuLabel>
                            {COUNSELLORS.map((c) => (
                              <DropdownMenuItem
                                key={c}
                                onClick={() => onQuickCounsellorChange(lead.id, c)}
                                className={c === lead.counsellor ? "bg-rose-50 text-[#8B1E1E] font-semibold" : ""}
                              >
                                {c}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenu>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <div className="h-5 w-5 rounded-full bg-rose-50 text-[#8B1E1E] border border-rose-200/50 flex items-center justify-center text-[10px] font-bold">
                              {getInitials(lead.counsellor)}
                            </div>
                            <span className="truncate max-w-[110px] text-slate-800 font-medium">
                              {lead.counsellor}
                            </span>
                          </div>
                        )}
                      </td>
                    )}

                    {/* Lead Status with 1-click Dropdown */}
                    {columnsVisibility.status && (
                      <td className={densityStyles[density]}>
                        <DropdownMenu
                          trigger={
                            <button
                              type="button"
                              className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all hover:ring-2 hover:ring-offset-1 hover:ring-slate-300",
                                statusMeta.bg,
                                statusMeta.color,
                                statusMeta.border
                              )}
                            >
                              <span className={cn("h-1.5 w-1.5 rounded-full", statusMeta.dot)} />
                              <span>{lead.status}</span>
                            </button>
                          }
                        >
                          <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                          {Object.values(LEAD_STATUSES).filter(s => !(s.adminOnly && currentRoleKey === "COUNSELLOR")).map((status) => (
                            <DropdownMenuItem
                              key={status.id}
                              onClick={() => onQuickStatusChange(lead.id, status.id)}
                              className="gap-2"
                            >
                              <span className={cn("h-2 w-2 rounded-full", status.dot)} />
                              <span className={status.id === lead.status ? "font-bold text-[#8B1E1E]" : ""}>
                                {status.label}
                              </span>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenu>
                      </td>
                    )}



                    {/* Row Actions Menu */}
                    <td className={cn(densityStyles[density], "text-right")}>
                      <DropdownMenu
                        align="right"
                        trigger={
                          <button
                            type="button"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                            aria-label="Actions"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        }
                      >
                        <DropdownMenuItem onClick={() => onViewLead(lead)} className="gap-2">
                          <Eye className="h-3.5 w-3.5 text-slate-500" />
                          <span>View Full Profile</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditLead(lead)} className="gap-2">
                          <Edit2 className="h-3.5 w-3.5 text-slate-500" />
                          <span>Edit Details</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onQuickContact(lead, "call")} className="gap-2">
                          <Phone className="h-3.5 w-3.5 text-slate-500" />
                          <span>Log Call</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onQuickContact(lead, "whatsapp")} className="gap-2">
                          <MessageSquare className="h-3.5 w-3.5 text-slate-500" />
                          <span>WhatsApp Message</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {canDelete && (
                          <DropdownMenuItem
                            onClick={() => onDeleteLead(lead)}
                            danger
                            className="gap-2"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete Record</span>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {leads.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 bg-slate-50/70 text-xs text-slate-600">
          <div className="flex items-center gap-3">
            <span>
              Showing <strong className="font-semibold text-slate-900">{startIndex}</strong> to{" "}
              <strong className="font-semibold text-slate-900">{endIndex}</strong> of{" "}
              <strong className="font-semibold text-slate-900">{leads.length}</strong> leads
            </span>

            {/* Page Size Selector */}
            <div className="flex items-center gap-1.5 ml-2 border-l border-slate-200 pl-3">
              <span>Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="h-7 rounded border border-slate-300 bg-white px-1.5 text-xs text-slate-800"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* Page Buttons */}
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
              className="h-7 px-2 text-xs"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" />
              Previous
            </Button>

            <span className="px-2 font-medium">
              Page {currentPage} of {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              className="h-7 px-2 text-xs"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
