# EduLead CRM — Production Lead Management System Dashboard

A modern, production-ready **Lead Management System Dashboard** designed specifically for higher education, universities, training institutes, and admissions teams. Built with **Next.js with JavaScript, Tailwind CSS, and shadcn/ui design patterns**.

---

## 🚀 Key Highlights & Real-World Features

### 1. 📊 Executive Summary Metrics Cards
- **Total Leads**: Real-time counter of all student inquiries with growth trends.
- **Today's Leads**: Highlights leads punched in the last 24 hours with a 1-click filter trigger.
- **Primary Leads**: Authentic unique student inquiries with percentage ratio.
- **Duplicate Leads**: Flagged repeat inquiries with quick review filter.
- **Pending Admissions**: Leads awaiting first counsellor outreach.
- **Total Admissions**: Confirmed admissions with conversion rate percentage and celebratory confetti trigger.

### 2. ⚡ Enterprise Responsive Data Table
Every lead record displays the exact required columns:
1. **Lead Name**: Candidate name with avatar initials, student ID, and acquisition source.
2. **Lead Punching Date & Time**: Timestamp with Indian locale formatting (e.g. `26 Sep 2026, 04:30 PM`) and relative time (`2h ago`, `yesterday`).
3. **Mobile Number**: Direct phone format with quick-call and WhatsApp triggers.
4. **Email ID**: Valid email with quick-mail composer trigger.
5. **College / University**: Target institute (e.g., *Delhi University, IIT Bombay, BITS Pilani, Symbiosis, Christ University*).
6. **Course**: Academic program (e.g., *B.Tech CS & AI, MBA Executive, Data Science, BCA Cyber Security*).
7. **Lead Type**: High-contrast badges distinguishing **Primary** (indigo badge) from **Duplicate** (amber badge) with duplicate counter and primary record links.
8. **Center Name**: Admissions branch (*North Campus Delhi, Bengaluru Central, Mumbai South, Pune Hinjewadi, Hyderabad Tech Hub, Kolkata Salt Lake*).
9. **Counsellor Name**: Assigned advisor with avatar and inline reassign dropdown.
10. **Admission Status**: Distinct visual badges with 1-click inline status dropdown:
    - 🟡 **Pending**: Initial inquiry under evaluation.
    - 🔵 **Follow-up**: Active consultation and scheduled campus visits.
    - 🟢 **Admitted**: Confirmed admission with celebratory confetti.
    - ⚪ **Not Interested**: Candidate declined or chose alternative career path.
    - 🔴 **Cancelled**: Registration cancelled.
    - 🟣 **Lost**: Lost to competing institute or unresponsive.
11. **Batch**: Intake period (*Fall 2026, Spring 2027, Batch A-2026, Weekend Executive*).
12. **Actions**: Full profile side-sheet, edit, phone log, WhatsApp, and safe delete.

### 3. 🔍 Real-Time Duplicate Lead Detection
- When adding a lead via **Punch New Lead**, the system monitors `Mobile Number` and `Email` in real-time.
- If a match is found with an existing lead, an alert banner displays the matched lead's name, ID, and punch date.
- The new submission is automatically marked as **Duplicate** and linked to the existing **Primary** lead record, preserving data hygiene and attribution.

### 4. 📂 Detailed Lead Profile Side-Sheet (Drawer)
Clicking on any candidate opens an enterprise profile drawer containing:
- **Overview & Academics**: Contact info, academic targets, center, batch, and duplicate linkage.
- **Follow-ups & Reminders**: Calendar of past and scheduled follow-ups, with a form to log calls, video consultations, and campus visits.
- **Audit Timeline**: Chronological event log tracking punching, counsellor assignments, and status transitions.
- **Internal Notes**: Private counselor remarks and guardian feedback.
- **Duplicate Inquiry History**: Shows all repeat submissions linked to this primary lead.

### 5. 👥 Multi-Role Access Control (Admin, Manager, Counsellor)
Switch roles instantly via the top right navigation:
- **Admin (Dr. Vikramaditya Rao)**: Full access to manage all leads, bulk operations, reassign counsellors, and permanent deletions.
- **Manager (Neha Kapoor)**: View and oversee all center leads, reassign team counsellors, and generate export reports.
- **Counsellor (Priya Sharma)**: Scoped view showing only leads assigned to her or unassigned leads. Delete and cross-team reassignments are restricted.

### 6. 🛠️ Productivity & Table Controls
- **Global Search**: Search across student name, phone, email, college, course, center, counsellor, and ID.
- **Multi-Filter Bar**: Filter by Date Range (Today, Yesterday, Last 7 Days, This Month), Lead Type, Status, College, Course, Center, Counsellor, and Batch.
- **Table Density**: Switch between *Compact*, *Default*, and *Relaxed* row height.
- **Column Visibility**: Toggle any column on or off.
- **Sorting**: Multi-column ascending and descending sorts.
- **Bulk Actions**: Select multiple leads to perform bulk status updates, assign counsellors, export to CSV, or bulk delete.
- **Export to CSV**: Download standard CSV files for reporting.
- **Persistent State & Sample Reset**: Changes persist in `localStorage`, with a 1-click **Reset Data** button in the header.

---

## 🏗️ Architecture & Technologies

- **Framework**: [Next.js](https://nextjs.org/) (App Router, React 19)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Components**: shadcn/ui inspired primitives (Data Table, Card, Badge, Sheet, Dialog, DropdownMenu, Tooltip, Input, Select, Skeleton, Toast)
- **Celebration Effects**: Canvas Confetti

---

## 🏃 Running the Project

The development server is running locally:
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

To create an optimized production build:
```bash
npm run build
npm run start
```
