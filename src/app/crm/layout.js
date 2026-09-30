"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Building2,
  TrendingUp,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Shield,
  UserCog,
} from "lucide-react";
import { ROLE_PERMISSIONS, getRoleLabel, getRoleBadgeClass } from "@/lib/auth";

/**
 * CRM Layout with real session-based sidebar navigation.
 *
 * Auth approach: Reads session from localStorage (set by useLeads/login flow)
 * since this is a client layout. Middleware handles server-side protection.
 * The layout shows/hides nav items based on the user's role.
 */
export default function CRMLayout({ children }) {
  const [session, setSession] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Load session from localStorage / cookie API
  useEffect(() => {
    let mounted = true;
    const loadSession = async () => {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        if (mounted) {
          if (data.authenticated && data.session) {
            setSession(data.session);
          } else {
            // Fallback to localStorage
            try {
              const isAuth = localStorage.getItem("crm_lms_is_auth") === "true";
              if (isAuth) {
                const stored = localStorage.getItem("crm_lms_user_v1");
                if (stored) setSession(JSON.parse(stored));
              }
            } catch {}
          }
        }
      } catch {
        try {
          const isAuth = localStorage.getItem("crm_lms_is_auth") === "true";
          if (isAuth && mounted) {
            const stored = localStorage.getItem("crm_lms_user_v1");
            if (stored) setSession(JSON.parse(stored));
          }
        } catch {}
      } finally {
        if (mounted) setIsLoaded(true);
      }
    };
    loadSession();
    return () => { mounted = false; };
  }, []);

  const handleLogout = async () => {
    try {
      localStorage.setItem("crm_lms_is_auth", "false");
      localStorage.removeItem("crm_lms_user_v1");
      await fetch("/api/auth/login", { method: "DELETE" }).catch(() => {});
    } catch {}
    router.push("/login");
  };

  const role = session?.role || null;
  const permissions = role ? (ROLE_PERMISSIONS[role] || {}) : {};

  // Navigation items with permission checks
  const navItems = [
    {
      href: "/crm",
      label: "Dashboard",
      icon: LayoutDashboard,
      show: true, // Everyone
      exact: true,
    },
    {
      href: "/crm/leads",
      label: "Leads",
      icon: TrendingUp,
      show: true, // Everyone
    },
    {
      href: "/crm/counsellors",
      label: "Counsellors",
      icon: Users,
      show: permissions.canViewCounsellors,
    },
    {
      href: "/crm/units",
      label: "Units",
      icon: Building2,
      show: permissions.canViewUnits,
    },
  ];

  const isActive = (item) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#FBFBFC] flex items-center justify-center">
        <div className="text-slate-400 text-sm animate-pulse">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFC] flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen z-50 w-64 flex-shrink-0 bg-white border-r border-slate-200/80 flex flex-col shadow-xl lg:shadow-none transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
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
              CMS Pro
            </div>
            <div className="text-[10px] text-slate-500 font-medium truncate">
              Lead Management
            </div>
          </div>
          <button
            className="ml-auto lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* User info */}
        {session && (
          <div className="px-4 py-3.5 border-b border-slate-100 bg-slate-50/60">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-rose-50 border border-rose-200/60 flex items-center justify-center text-xs font-bold text-[#8B1E1E] flex-shrink-0">
                {session.avatar || (session.name || "U").slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {session.name || "User"}
                </p>
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${getRoleBadgeClass(session.role)}`}
                >
                  {getRoleLabel(session.role)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems
            .filter((item) => item.show)
            .map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                    active
                      ? "bg-[#8B1E1E]/8 text-[#8B1E1E] border border-[#8B1E1E]/15 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 flex-shrink-0 transition-colors ${
                      active ? "text-[#8B1E1E]" : "text-slate-400 group-hover:text-slate-600"
                    }`}
                  />
                  <span className="flex-1">{item.label}</span>
                  {active && (
                    <ChevronRight className="h-3.5 w-3.5 text-[#8B1E1E] flex-shrink-0" />
                  )}
                </Link>
              );
            })}
        </nav>

        {/* Bottom actions */}
        <div className="px-3 py-4 border-t border-slate-100 space-y-1">
          {session?.role === "Admin" && (
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-[#8B1E1E] hover:bg-rose-50 transition-all group"
            >
              <Shield className="h-4 w-4 flex-shrink-0 text-slate-400 group-hover:text-[#8B1E1E] transition-colors" />
              <span>Admin Panel</span>
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 transition-all group"
          >
            <LogOut className="h-4 w-4 flex-shrink-0 text-slate-400 group-hover:text-red-500 transition-colors" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 h-14 flex items-center justify-between shadow-xs">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <img
            src="/logo.jpeg"
            alt="CMS Logo"
            className="h-8 w-auto object-contain mix-blend-multiply"
          />
          <div className="w-9" /> {/* Spacer */}
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
