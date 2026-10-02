"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  GraduationCap,
  Landmark,
  LogOut,
  Menu,
  ChevronRight,
  UserCog,
  Shield,
  ArrowLeft,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Overview",  icon: LayoutDashboard, exact: true },
  { href: "/admin/users",     label: "Users",     icon: Users },
  { href: "/admin/colleges",  label: "Colleges",  icon: Landmark },
  { href: "/admin/courses",   label: "Courses",   icon: GraduationCap },
  { href: "/admin/units",     label: "Units",     icon: Building2 },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    try {
      const role = localStorage.getItem("crm_lms_current_role_v1");
      const isAuth = localStorage.getItem("crm_lms_is_auth") === "true";
      setIsAuthenticated(isAuth && role === "ADMIN");
    } catch {
      setIsAuthenticated(false);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      localStorage.setItem("crm_lms_is_auth", "false");
      localStorage.removeItem("crm_lms_user_v1");
      await fetch("/api/auth/login", { method: "DELETE" }).catch(() => {});
    } catch {}
    window.location.href = "/admin";
  }, []);

  const isActive = (item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  // While checking auth, render nothing (avoids flash)
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#FBFBFC] flex items-center justify-center">
        <div className="text-slate-400 text-sm animate-pulse">Loading…</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FBFBFC] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-10 text-center max-w-sm w-full">
          <div className="h-14 w-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-5">
            <Shield className="h-7 w-7 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Access Restricted</h1>
          <p className="text-sm text-slate-500 mb-6">
            You must be logged in as an Admin to access this panel.
          </p>
          <a
            href="/admin"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#8B1E1E] text-white text-sm font-semibold hover:bg-[#6d1414] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFC] flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside
        className={`fixed top-0 left-0 h-screen z-50 w-64 flex-shrink-0 bg-white border-r border-slate-200/80 flex flex-col shadow-xl transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          ${!desktopCollapsed ? "lg:sticky lg:translate-x-0 lg:shadow-none" : "lg:fixed lg:-translate-x-full"}`}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <img
            src="/logo.jpeg"
            alt="CMS Logo"
            className="h-9 w-auto object-contain mix-blend-multiply flex-shrink-0"
          />
          <div className="min-w-0">
            <div className="text-xs font-bold uppercase tracking-wider text-[#8B1E1E]">
              Admin Pro
            </div>
            <div className="text-[10px] text-slate-500 font-medium truncate">
              System Configuration
            </div>
          </div>
          <button
            className="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            onClick={() => { setSidebarOpen(false); setDesktopCollapsed(true); }}
            title="Hide Sidebar"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group
                  ${active
                    ? "bg-[#8B1E1E]/8 text-[#8B1E1E] border border-[#8B1E1E]/15 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"}`}
              >
                <Icon className={`h-4 w-4 flex-shrink-0 transition-colors ${active ? "text-[#8B1E1E]" : "text-slate-400 group-hover:text-slate-600"}`} />
                <span className="flex-1">{item.label}</span>
                {active && <ChevronRight className="h-3.5 w-3.5 text-[#8B1E1E] flex-shrink-0" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="px-3 py-4 border-t border-slate-100 space-y-1">
          <a
            href="/admin/crm"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-all group"
          >
            <ArrowLeft className="h-4 w-4 flex-shrink-0 text-slate-400 group-hover:text-slate-600 transition-colors" />
            <span>Back to CRM</span>
          </a>
          <a
            href="/profile"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all group"
          >
            <UserCog className="h-4 w-4 flex-shrink-0 text-slate-400 group-hover:text-blue-500 transition-colors" />
            <span>Profile</span>
          </a>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 transition-all group"
          >
            <LogOut className="h-4 w-4 flex-shrink-0 text-slate-400 group-hover:text-red-500 transition-colors" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile / collapsed-desktop top bar */}
        <div
          className={`sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 h-14 flex items-center justify-between shadow-xs
            ${!desktopCollapsed ? "lg:hidden" : ""}`}
        >
          <button
            onClick={() => { setSidebarOpen(true); setDesktopCollapsed(false); }}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <img src="/logo.jpeg" alt="CMS Logo" className="h-8 w-auto object-contain mix-blend-multiply" />
          <div className="w-9" />
        </div>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
