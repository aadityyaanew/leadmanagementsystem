"use client";

/**
 * @file useAuth.js
 * Centralized authentication hook for client components.
 *
 * Architecture:
 * - Reads session from the lms_session cookie (set by login API).
 * - Falls back to localStorage for backward compat with useLeads hook.
 * - Provides login/logout helpers that update both storage mechanisms.
 * - Single source of truth for auth state in the CRM/Admin UIs.
 *
 * The existing useLeads hook still manages leads state and its own auth
 * state independently. This hook wraps the same storage keys so both
 * are always in sync.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { ROLE_PERMISSIONS, getRoleLabel, getRoleBadgeClass } from "@/lib/auth";

const ROLE_STORAGE_KEY = "crm_lms_current_role_v1";
const AUTH_STORAGE_KEY = "crm_lms_is_auth";
const USER_STORAGE_KEY = "crm_lms_user_v1";

export function useAuth() {
  const [session, setSession] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Read session from cookie + localStorage on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Try to read from cookie via API (most reliable)
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        if (mounted) {
          if (data.authenticated && data.session) {
            setSession(data.session);
            // Keep localStorage in sync
            try {
              localStorage.setItem(ROLE_STORAGE_KEY, data.session.roleKey);
              localStorage.setItem(AUTH_STORAGE_KEY, "true");
              localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.session));
            } catch {}
          } else {
            // Fall back to localStorage
            const isAuth = localStorage.getItem(AUTH_STORAGE_KEY) === "true";
            if (isAuth) {
              const stored = localStorage.getItem(USER_STORAGE_KEY);
              if (stored) {
                try {
                  setSession(JSON.parse(stored));
                } catch {}
              }
            }
          }
        }
      } catch {
        // Offline/error: fall back to localStorage
        try {
          const isAuth = localStorage.getItem(AUTH_STORAGE_KEY) === "true";
          if (isAuth && mounted) {
            const stored = localStorage.getItem(USER_STORAGE_KEY);
            if (stored) {
              try {
                setSession(JSON.parse(stored));
              } catch {}
            }
          }
        } catch {}
      } finally {
        if (mounted) setIsLoaded(true);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const login = useCallback((sessionData, roleKey) => {
    // sessionData: the user object from the API response
    const fullSession = { ...sessionData, roleKey };
    setSession(fullSession);
    try {
      localStorage.setItem(ROLE_STORAGE_KEY, roleKey);
      localStorage.setItem(AUTH_STORAGE_KEY, "true");
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(fullSession));
    } catch {}
  }, []);

  const logout = useCallback(async () => {
    setSession(null);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, "false");
      localStorage.removeItem(USER_STORAGE_KEY);
      // Clear cookie via API
      await fetch("/api/auth/login", { method: "DELETE" });
    } catch {}
  }, []);

  const isAuthenticated = Boolean(session);

  const permissions = useMemo(() => {
    if (!session) return {};
    return ROLE_PERMISSIONS[session.role] || {};
  }, [session]);

  const can = useCallback((permission) => {
    if (!session) return false;
    return Boolean(permissions[permission]);
  }, [session, permissions]);

  return {
    session,
    isLoaded,
    isAuthenticated,
    permissions,
    can,
    login,
    logout,
    // Convenience accessors
    userId: session?.id || null,
    userName: session?.name || null,
    userEmail: session?.email || null,
    userRole: session?.role || null,
    userRoleKey: session?.roleKey || null,
    unitId: session?.unit_id || null,
    avatar: session?.avatar || null,
    roleLabel: session ? getRoleLabel(session.role) : null,
    roleBadgeClass: session ? getRoleBadgeClass(session.role) : null,
  };
}
