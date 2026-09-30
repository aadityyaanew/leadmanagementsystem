"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoginScreen } from "@/components/dashboard/LoginScreen";
import { useLeads } from "@/hooks/useLeads";

export default function LoginPage() {
  const { isAuthenticated, login, currentRoleKey, isLoaded } = useLeads();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isAuthenticated) {
      if (currentRoleKey === "ADMIN") {
        router.replace("/admin/dashboard");
      } else {
        router.replace("/crm/dashboard");
      }
    }
  }, [isLoaded, isAuthenticated, currentRoleKey, router]);

  if (isLoaded && isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400 text-sm font-medium animate-pulse">Redirecting…</div>
      </div>
    );
  }

  // Pass both roleKey and session data to login
  const handleLogin = (roleKey, sessionData) => {
    login(roleKey, sessionData);
  };

  return <LoginScreen onLogin={handleLogin} isAdmin={false} />;
}
