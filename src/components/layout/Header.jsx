"use client";

import React from "react";
import Image from "next/image";
import {
  Plus,
  RotateCcw,
  ChevronDown,
  Sparkles,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DropdownMenu, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/Dropdown";
import { USER_ROLES } from "@/lib/constants";

export function Header({
  currentRoleKey,
  onSwitchRole,
  onLogout,
  onOpenAddModal,
  onResetData,
  totalLeadsCount,
}) {
  const currentRole = USER_ROLES[currentRoleKey] || USER_ROLES.ADMIN;

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-xs transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Compare Degree Brand & Logo */}
        <div className="flex items-center gap-3.5">
          <div className="flex items-center">
            <img src="/logo.jpeg" alt="CMS Logo" className="h-12 w-auto object-contain mix-blend-multiply" />
          </div>

          <div className="hidden sm:block border-l border-slate-200 pl-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8B1E1E]">
                CMS Pro
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Centralized Lead Management
            </p>
          </div>
        </div>

        {/* Action Controls & Role Switcher */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Admin Panel Link - only for ADMIN role */}
          {currentRoleKey === "ADMIN" && (
            <a
              href="/admin/dashboard"
              title="Go to Admin Panel"
              className="hidden md:inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-[#8B1E1E] hover:bg-rose-100 transition-colors shadow-2xs"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>Admin Panel</span>
            </a>
          )}



          {/* Role Switcher Dropdown */}
          <DropdownMenu
            align="right"
            trigger={
              <button
                type="button"
                className="flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-2.5 py-1.5 text-left text-xs font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-2xs"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 font-bold text-[#8B1E1E] border border-rose-200/60 text-xs">
                  {currentRole.avatar}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="flex items-center gap-1 leading-none">
                    <span className="font-semibold text-slate-800">
                      {currentRole.name}
                    </span>
                    <span className="text-[10px] text-[#8B1E1E] font-semibold">
                      ({currentRole.label})
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 leading-tight">
                    {currentRole.title}
                  </span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>
            }
          >
            <DropdownMenuLabel>My Profile</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="px-2.5 py-1.5 text-[11px] text-slate-500">
              <span className="font-semibold text-slate-700 block mb-0.5">
                Role Permissions:
              </span>
              <ul className="space-y-0.5 list-disc list-inside text-[10px]">
                {currentRole.permissions.canDeleteLeads ? (
                  <li className="text-emerald-700 font-medium">Can delete leads</li>
                ) : (
                  <li className="text-slate-400">Delete restricted</li>
                )}
                {currentRole.permissions.viewAllLeads ? (
                  <li className="text-[#8B1E1E] font-medium">View all university leads</li>
                ) : (
                  <li className="text-amber-700 font-medium">Assigned leads only</li>
                )}
                {currentRole.permissions.canAssignCounsellor && (
                  <li>Reassign counsellors</li>
                )}
              </ul>
            </div>
            {currentRoleKey !== "ADMIN" && (
              <>
                <DropdownMenuSeparator />
                <div className="px-2 pb-1">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                    onClick={onLogout}
                  >
                    Logout
                  </Button>
                </div>
              </>
            )}
          </DropdownMenu>

          {/* Quick Add Lead Primary Button */}
          <Button
            onClick={onOpenAddModal}
            className="gap-1.5 shadow-sm font-semibold"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Punch New Lead</span>
            <span className="sm:hidden">Punch</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
