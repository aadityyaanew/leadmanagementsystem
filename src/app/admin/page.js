"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoginScreen } from "@/components/dashboard/LoginScreen";
import { useAuth } from "@/hooks/useAuth";

export default function AdminLoginPage() {
  const { isAuthenticated, login, userRoleKey, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isAuthenticated) {
      if (userRoleKey === "ADMIN") {
        router.replace("/admin/dashboard");
      } else {
        router.replace("/crm/dashboard");
      }
    }
  }, [isLoaded, isAuthenticated, userRoleKey, router]);

  if (isLoaded && isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400 text-sm font-medium animate-pulse">Redirecting…</div>
      </div>
    );
  }

  const handleLogin = (roleKey, sessionData) => {
    login(roleKey, sessionData);
  };

  return <LoginScreen onLogin={handleLogin} isAdmin={true} />;
}
