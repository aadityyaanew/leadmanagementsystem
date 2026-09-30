"use client";

import { CRMPage } from "@/components/dashboard/CRMPage";

/**
 * /admin/crm - Admin's CRM leads view.
 * Admins access CRM at this URL (middleware redirects /crm to /admin/crm for admins).
 * Uses the same CRMPage component as the employee CRM.
 */
export default function AdminCRMPage() {
  return <CRMPage />;
}
