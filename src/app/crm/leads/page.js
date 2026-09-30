"use client";

import { CRMPage } from "@/components/dashboard/CRMPage";

/**
 * /crm/leads - Leads management page.
 * Embedded mode: renders without its own full-page wrapper + header,
 * since the CRM layout already provides the sidebar and navigation.
 */
export default function CRMLeadsPage() {
  return <CRMPage embedded />;
}
