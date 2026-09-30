"use client";

import React from "react";
import {
  Users,
  Clock,
  Flame,
  CreditCard,
  Banknote,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

export function MetricCards({ metrics, activePresetFilter, onSelectPresetFilter }) {
  const cards = [
    {
      id: "ALL",
      title: "Total Leads",
      value: metrics.total,
      subtext: "Active student inquiries",
      icon: Users,
      iconColor: "text-[#8B1E1E]",
      iconBg: "bg-rose-50",
      borderAccent: "hover:border-[#8B1E1E]/40",
      badge: "All",
      badgeVariant: "default",
    },
    {
      id: "NEW_LEAD",
      title: "New Leads",
      value: metrics.newLeads ?? metrics.pendingAdmissions,
      subtext: "Awaiting counsellor review",
      icon: Clock,
      iconColor: "text-blue-700",
      iconBg: "bg-blue-50/80",
      borderAccent: "hover:border-blue-300",
      badge: `${metrics.newLeads ?? metrics.pendingAdmissions} leads`,
      badgeVariant: "brand",
    },
    {
      id: "HOT_LEADS",
      title: "Hot Leads",
      value: metrics.hotLeads,
      subtext: "Warm & Hot prospects",
      icon: Flame,
      iconColor: "text-amber-600",
      iconBg: "bg-amber-50",
      borderAccent: "hover:border-amber-300",
      badge: "Hot",
      badgeVariant: "warning",
    },
    {
      id: "REGISTRATION_PAID",
      title: "Registration Paid",
      value: metrics.registrationPaid,
      subtext: "Initial payment done",
      icon: CreditCard,
      iconColor: "text-purple-700",
      iconBg: "bg-purple-50",
      borderAccent: "hover:border-purple-300",
      badge: "Paid",
      badgeVariant: "brand",
    },
    {
      id: "FEES_PAID",
      title: "Fees Collected",
      value: metrics.feesPaid,
      subtext: "Full payment received",
      icon: Banknote,
      iconColor: "text-teal-700",
      iconBg: "bg-teal-50",
      borderAccent: "hover:border-teal-300",
      badge: "Collected",
      badgeVariant: "success",
    },
    {
      id: "ADMISSION_APPROVED",
      title: "Admission Approved",
      value: metrics.admissionApproved ?? metrics.totalAdmitted,
      subtext: `${metrics.conversionRate}% conversion rate`,
      icon: TrendingUp,
      iconColor: "text-emerald-700",
      iconBg: "bg-emerald-50",
      borderAccent: "hover:border-emerald-300",
      badge: "Approved",
      badgeVariant: "success",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;
        const isSelected =
          activePresetFilter === card.id ||
          (card.id === "NEW_LEAD" && activePresetFilter === "PENDING") ||
          (card.id === "ADMISSION_APPROVED" && activePresetFilter === "ADMITTED");

        return (
          <div
            key={card.id}
            onClick={() => onSelectPresetFilter?.(card.id)}
            className={cn(
              "group relative flex flex-col justify-between rounded-xl border bg-white p-4 shadow-xs transition-all duration-200 cursor-pointer hover:shadow-md",
              isSelected
                ? "border-[#8B1E1E] ring-2 ring-[#8B1E1E]/20 shadow-[#8B1E1E]/5 bg-rose-50/20"
                : "border-slate-200/90",
              card.borderAccent
            )}
          >
            {/* Top row: Icon & Badge */}
            <div className="flex items-center justify-between gap-1 mb-2">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg transition-transform group-hover:scale-105 border border-slate-100",
                  card.iconBg,
                  card.iconColor
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              {card.badge && (
                <Badge variant={card.badgeVariant} className="text-[10px] px-1.5 py-0">
                  {card.badge}
                </Badge>
              )}
            </div>

            {/* Middle: Metric value & Title */}
            <div>
              <div className="text-2xl font-bold tracking-tight text-slate-900">
                {card.value}
              </div>
              <h4 className="text-xs font-semibold text-slate-700 truncate mt-0.5">
                {card.title}
              </h4>
            </div>

            {/* Bottom: Subtext & indicator */}
            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="truncate">{card.subtext}</span>
            </div>

            {/* Active indicator dot */}
            {isSelected && (
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#8B1E1E] animate-pulse" />
            )}
          </div>
        );
      })}
    </div>
  );
}
