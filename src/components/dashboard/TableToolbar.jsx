"use client";

import React, { useState } from "react";
import { useLeads } from "@/hooks/useLeads";
import {
  Search,
  X,
  Download,
  Eye,
  Check,
  Filter,
  RefreshCw,
  Upload,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { DropdownMenu, DropdownMenuLabel } from "@/components/ui/Dropdown";
import {
  LEAD_STATUSES,
  COLLEGES,
  COURSES,
  CENTERS,
  COUNSELLORS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

export function TableToolbar({

  searchQuery,
  onSearchChange,
  filters,
  onFilterChange,
  onResetFilters,
  columnsVisibility,
  onToggleColumn,
  density,
  onDensityChange,
  onExportCSV,
  onImportCSV,
  totalResultsCount,
}) {
  const { currentRoleKey } = useLeads();
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Count active non-default filters
  const activeFiltersCount = [
    searchQuery,
    filters.leadType !== "ALL",
    filters.status !== "ALL",
    filters.dateRange !== "ALL",
    filters.college !== "ALL",
    filters.course !== "ALL",
    filters.center !== "ALL",
    filters.counsellor !== "ALL",
  ].filter(Boolean).length;

  const columnLabels = {
    name: "Lead Name",
    punchDate: "Punching Date & Time",
    mobile: "Mobile Number",
    email: "Email ID",
    college: "College",
    course: "Course",
    leadType: "Lead Type",
    center: "Unit Name",
    counsellor: "Counsellor Name",
    status: "Lead Status",
  };

  return (
    <div className="space-y-3 mb-4">
      {/* Primary Toolbar Row */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Search & Quick Filter Trigger */}
        <div className="flex flex-1 items-center gap-2 max-w-xl">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Search leads by student name, phone, email, college, ID..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              startIcon={Search}
              className="bg-white text-xs sm:text-sm h-9 shadow-2xs focus-visible:ring-[#8B1E1E] focus-visible:border-[#8B1E1E]"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <Button
            variant={showAdvancedFilters || activeFiltersCount > 0 ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={cn(
              "gap-1.5 h-9 shrink-0 text-xs font-semibold",
              activeFiltersCount > 0 && "border-[#8B1E1E] text-[#8B1E1E] bg-rose-50"
            )}
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#8B1E1E] text-[10px] font-bold text-white">
                {activeFiltersCount}
              </span>
            )}
          </Button>

          {activeFiltersCount > 0 && (
            <button
              onClick={onResetFilters}
              className="text-xs text-slate-500 hover:text-rose-700 flex items-center gap-1 transition-colors px-1 shrink-0 font-medium"
              title="Reset all filters"
            >
              <RefreshCw className="h-3 w-3" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>

        {/* Right side tools: Column Visibility, Density, Export */}
        <div className="flex items-center gap-2 self-end lg:self-auto">
          {/* Table Density Switcher */}
          <div className="hidden sm:flex items-center rounded-lg border border-slate-200 bg-white p-0.5 text-xs shadow-2xs">
            <button
              onClick={() => onDensityChange("compact")}
              className={cn(
                "rounded-md px-2 py-1 transition-colors",
                density === "compact"
                  ? "bg-rose-50 font-bold text-[#8B1E1E]"
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              Compact
            </button>
            <button
              onClick={() => onDensityChange("default")}
              className={cn(
                "rounded-md px-2 py-1 transition-colors",
                density === "default"
                  ? "bg-rose-50 font-bold text-[#8B1E1E]"
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              Default
            </button>
            <button
              onClick={() => onDensityChange("relaxed")}
              className={cn(
                "rounded-md px-2 py-1 transition-colors",
                density === "relaxed"
                  ? "bg-rose-50 font-bold text-[#8B1E1E]"
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              Relaxed
            </button>
          </div>

          {/* Column Visibility Selector */}
          <DropdownMenu
            align="right"
            trigger={
              <Button variant="outline" size="sm" className="gap-1.5 h-9 text-xs font-medium">
                <Eye className="h-3.5 w-3.5 text-slate-500" />
                <span className="hidden sm:inline">Columns</span>
              </Button>
            }
          >
            <DropdownMenuLabel>Visible Columns</DropdownMenuLabel>
            {Object.keys(columnsVisibility).map((colKey) => {
              const isVisible = columnsVisibility[colKey];
              return (
                <button
                  key={colKey}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleColumn(colKey);
                  }}
                  className="flex w-full items-center justify-between px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-md transition-colors font-medium"
                >
                  <span>{columnLabels[colKey] || colKey}</span>
                  {isVisible && <Check className="h-3.5 w-3.5 text-[#8B1E1E]" />}
                </button>
              );
            })}
          </DropdownMenu>

          {/* Upload CSV */}
          <label className="cursor-pointer inline-flex items-center justify-center gap-1.5 h-9 rounded-md px-3 text-xs font-semibold border border-input bg-white hover:bg-slate-50 text-slate-700 hover:text-[#8B1E1E] transition-colors border-slate-200">
            <Upload className="h-3.5 w-3.5" />
            <span>Upload CSV</span>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0] && onImportCSV) {
                  onImportCSV(e.target.files[0]);
                  e.target.value = null;
                }
              }}
            />
          </label>

          {/* Export to CSV Button */}
          {currentRoleKey === "ADMIN" && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExportCSV}
              className="gap-1.5 h-9 text-xs font-semibold text-slate-700 hover:text-[#8B1E1E] hover:border-[#8B1E1E]/40"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Filter Drawer / Bar */}
      {showAdvancedFilters && (
        <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-xs animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
            {/* Date Range Preset */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Date Punched
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => onFilterChange("dateRange", e.target.value)}
                className="w-full h-8 rounded-lg border border-slate-300 bg-white px-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#8B1E1E]"
              >
                <option value="ALL">All Time</option>
                <option value="TODAY">Today (24h)</option>
                <option value="YESTERDAY">Yesterday</option>
                <option value="LAST_7_DAYS">Last 7 Days</option>
                <option value="THIS_MONTH">This Month</option>
              </select>
            </div>

            {/* Lead Type */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Lead Type
              </label>
              <select
                value={filters.leadType}
                onChange={(e) => onFilterChange("leadType", e.target.value)}
                className="w-full h-8 rounded-lg border border-slate-300 bg-white px-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#8B1E1E]"
              >
                <option value="ALL">All Types</option>
                <option value="Primary">Primary Leads Only</option>
                <option value="Duplicate">Duplicate Leads Only</option>
              </select>
            </div>

            {/* Lead Status */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Lead Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => onFilterChange("status", e.target.value)}
                className="w-full h-8 rounded-lg border border-slate-300 bg-white px-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#8B1E1E]"
              >
                <option value="ALL">All Statuses</option>
                {Object.values(LEAD_STATUSES).filter(s => !(s.adminOnly && currentRoleKey === "COUNSELLOR")).map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            {/* College */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                College
              </label>
              <select
                value={filters.college}
                onChange={(e) => onFilterChange("college", e.target.value)}
                className="w-full h-8 rounded-lg border border-slate-300 bg-white px-2 text-xs text-slate-800 truncate focus:outline-none focus:ring-1 focus:ring-[#8B1E1E]"
              >
                <option value="ALL">All Colleges</option>
                {COLLEGES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Course */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Course
              </label>
              <select
                value={filters.course}
                onChange={(e) => onFilterChange("course", e.target.value)}
                className="w-full h-8 rounded-lg border border-slate-300 bg-white px-2 text-xs text-slate-800 truncate focus:outline-none focus:ring-1 focus:ring-[#8B1E1E]"
              >
                <option value="ALL">All Courses</option>
                {COURSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Unit */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Unit
              </label>
              <select
                value={filters.center}
                onChange={(e) => onFilterChange("center", e.target.value)}
                className="w-full h-8 rounded-lg border border-slate-300 bg-white px-2 text-xs text-slate-800 truncate focus:outline-none focus:ring-1 focus:ring-[#8B1E1E]"
              >
                <option value="ALL">All Units</option>
                {CENTERS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Counsellor */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Counsellor
              </label>
              <select
                value={filters.counsellor}
                onChange={(e) => onFilterChange("counsellor", e.target.value)}
                className="w-full h-8 rounded-lg border border-slate-300 bg-white px-2 text-xs text-slate-800 truncate focus:outline-none focus:ring-1 focus:ring-[#8B1E1E]"
              >
                <option value="ALL">All Counsellors</option>
                {COUNSELLORS.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
