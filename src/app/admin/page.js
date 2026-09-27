"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoginScreen } from "@/components/dashboard/LoginScreen";
import { useLeads } from "@/hooks/useLeads";

export default function AdminLoginPage() {
  const { isAuthenticated, login, currentRoleKey, isLoaded } = useLeads();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isAuthenticated) {
      if (currentRoleKey === "ADMIN") {
        router.push("/admin/dashboard");
      } else {
        router.push("/crm");
      }
    }
  }, [isLoaded, isAuthenticated, currentRoleKey, router]);

  if (isLoaded && isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400 text-sm font-medium animate-pulse">Redirecting...</div>
      </div>
    );
  }

  return <LoginScreen onLogin={login} isAdmin={true} />;
}
