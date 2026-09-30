"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * /crm root → redirects to /crm/dashboard
 */
export default function CRMRootPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/crm/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#FBFBFC] flex items-center justify-center">
      <div className="text-slate-400 text-sm animate-pulse">Redirecting to dashboard…</div>
    </div>
  );
}
