# Lead Management System (LMS) - Development Plan

This document outlines the step-by-step roadmap for building out the Lead Management System, catering to the 4 specific roles (Admin, Business Manager, Unit Head, Counsellor).

## Phase 1: Database & Schema Design
**Goal:** Define how data is stored and relationships between entities.
- **Tech Stack:** Decide on Database (e.g., PostgreSQL, MongoDB) and ORM (e.g., Prisma, Drizzle, Mongoose).
- **Tasks:**
  - Create `User` schema (with Role ENUM).
  - Create `Unit` schema (Managed by Business Manager).
  - Create `Lead` schema (Assigned to Counsellors, with status tracking).
  - Establish relationships (e.g., A Unit has many Unit Heads, a Unit Head has many Counsellors).

## Phase 2: Authentication & Authorization
**Goal:** Secure the application and implement role-based access control.
- **Tech Stack:** NextAuth.js / Auth.js or Supabase Auth.
- **Tasks:**
  - Setup login/registration flow.
  - Inject the user's `role` into the session token.
  - Implement Next.js `middleware.js` to protect routes based on the role hierarchy (e.g., block Counsellors from `/crm/units`).
  - Connect the `<RoleGuard>` component to the real session state.

## Phase 3: Core UI & Design System
**Goal:** Build a premium, cohesive, and responsive interface.
- **Tech Stack:** Tailwind CSS + UI Library (e.g., shadcn/ui or similar modern components).
- **Tasks:**
  - Define global typography, colors, and layout spacing.
  - Build reusable UI components (Buttons, Modals, Data Tables, Cards, Inputs).
  - Polish the `CRMLayout` sidebar with active states and dynamic role-based menus.

## Phase 4: Feature Implementation (By Domain)
**Goal:** Build out the specific pages and data fetching logic for each section.

### 4.1 Leads Management (All Roles)
- Build Kanban board / Data Table for Leads.
- Setup Server Actions to Add, Edit, and Update Lead statuses.
- **Data Scoping:** 
  - Admin/BM: Sees all leads.
  - Unit Head: Sees leads for their unit's counsellors.
  - Counsellor: Sees only their assigned leads.

### 4.2 Counsellors Management (Unit Head, BM, Admin)
- Build UI to add, remove, and monitor performance of Counsellors.
- Setup logic to assign Leads to specific Counsellors.

### 4.3 Units Management (BM, Admin)
- Build UI to create and manage Units.
- Assign Unit Heads to specific Units.

### 4.4 Dashboard Analytics (All Roles)
- Build charts and metric cards (e.g., Leads Closed, Conversion Rate).
- Ensure data aggregated matches the user's role authorization level.

## Phase 5: Polish & Deployment
**Goal:** Get the app ready for production use.
- **Tasks:**
  - Add toast notifications for success/error actions.
  - Implement loading states (Skeleton loaders) using Next.js `loading.js`.
  - Thoroughly test Role-Based Access controls (RBAC) to ensure no data leaks.
  - Deploy to Vercel/production environment.
