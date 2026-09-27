export const LEAD_STATUSES = {
  NEW_LEAD: {
    id: "New Lead",
    label: "New Lead",
    color: "text-blue-700",
    bg: "bg-blue-50/90",
    border: "border-blue-200",
    dot: "bg-blue-500",
    description: "Initial lead inquiry received",
  },
  HOT: {
    id: "Hot",
    label: "Hot",
    color: "text-rose-700",
    bg: "bg-rose-50/90",
    border: "border-rose-200",
    dot: "bg-rose-500",
    description: "High intent to join",
  },
  WARM: {
    id: "Warm",
    label: "Warm",
    color: "text-amber-700",
    bg: "bg-amber-50/90",
    border: "border-amber-200",
    dot: "bg-amber-500",
    description: "Moderate interest",
  },
  COLD: {
    id: "Cold",
    label: "Cold",
    color: "text-slate-700",
    bg: "bg-slate-50/90",
    border: "border-slate-200",
    dot: "bg-slate-500",
    description: "Low interest",
  },
  ATTEMPTING_TO_CALL: {
    id: "Attempting to call",
    label: "Attempting to call",
    color: "text-yellow-700",
    bg: "bg-yellow-50/90",
    border: "border-yellow-200",
    dot: "bg-yellow-500",
    description: "Trying to reach the lead",
  },
  FOLLOW_UP_NEXT_BATCH: {
    id: "Follow up for Next Batch",
    label: "Follow up for Next Batch",
    color: "text-indigo-700",
    bg: "bg-indigo-50/90",
    border: "border-indigo-200",
    dot: "bg-indigo-500",
    description: "Interested for future batch",
  },
  REGISTRATION_PAID: {
    id: "Registration Paid",
    label: "Registration Paid",
    color: "text-purple-700",
    bg: "bg-purple-50/90",
    border: "border-purple-200",
    dot: "bg-purple-500",
    description: "Registration / application fee paid",
  },
  FEES_COLLECTED: {
    id: "Fees Collected",
    label: "Fees Collected",
    color: "text-teal-700",
    bg: "bg-teal-50/90",
    border: "border-teal-200",
    dot: "bg-teal-500",
    description: "Full course / academic fees collected",
  },
  ADMISSION_APPROVED: {
    id: "Admission Approved",
    label: "Admission Approved",
    color: "text-emerald-700",
    bg: "bg-emerald-50/90",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    description: "Admission confirmed & approved",
    adminOnly: true,
  },
  DROPPED_NOT_INTERESTED: {
    id: "Dropped Not Interested",
    label: "Dropped Not Interested",
    color: "text-gray-700",
    bg: "bg-gray-50/90",
    border: "border-gray-200",
    dot: "bg-gray-500",
    description: "Lead dropped or not interested",
  },
  CLOSED_LOST: {
    id: "Closed Lost",
    label: "Closed Lost",
    color: "text-red-700",
    bg: "bg-red-50/90",
    border: "border-red-200",
    dot: "bg-red-500",
    description: "Lead lost to competition or other reasons",
  },
};

export const LEAD_STATUS_LIST = Object.values(LEAD_STATUSES);

// Non-enumerable aliases for backward compatibility
Object.defineProperties(LEAD_STATUSES, {
  PENDING: { value: LEAD_STATUSES.NEW_LEAD, enumerable: false, configurable: true },
  FOLLOW_UP: { value: LEAD_STATUSES.FOLLOW_UP_NEXT_BATCH, enumerable: false, configurable: true },
  ADMITTED: { value: LEAD_STATUSES.ADMISSION_APPROVED, enumerable: false, configurable: true },
  NOT_INTERESTED: { value: LEAD_STATUSES.DROPPED_NOT_INTERESTED, enumerable: false, configurable: true },
  CANCELLED: { value: LEAD_STATUSES.CLOSED_LOST, enumerable: false, configurable: true },
  LOST: { value: LEAD_STATUSES.CLOSED_LOST, enumerable: false, configurable: true },
});

export function getLeadStatus(status) {
  if (!status) return LEAD_STATUSES.NEW_LEAD;
  const key = status.toUpperCase().replace(/[\s-]+/g, "_");
  if (LEAD_STATUSES[key]) {
    return LEAD_STATUSES[key];
  }
  if (key === "PENDING") return LEAD_STATUSES.NEW_LEAD;
  if (key === "FOLLOW_UP") return LEAD_STATUSES.FOLLOW_UP_NEXT_BATCH;
  if (key === "ADMITTED") return LEAD_STATUSES.ADMISSION_APPROVED;
  return LEAD_STATUSES.NEW_LEAD;
}

export const LEAD_TYPES = {
  PRIMARY: {
    id: "Primary",
    label: "Primary",
    badgeClass: "bg-rose-50 text-[#8B1E1E] border-rose-200 font-semibold",
    description: "First authentic registration for this contact",
  },
  DUPLICATE: {
    id: "Duplicate",
    label: "Duplicate",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200 font-medium",
    description: "Repeat punch with matching phone or email",
  },
};

export const USER_ROLES = {
  ADMIN: {
    id: "Admin",
    label: "Chief Admission Officer",
    title: "Chief Admission Officer",
    name: "Vishal Raj",
    email: "admin@comparedegree.com",
    password: "password123",
    avatar: "VR",
    permissions: {
      canDeleteLeads: true,
      canBulkManage: true,
      canAssignCounsellor: true,
      canExport: true,
      viewAllLeads: true,
    },
  },
  BUSINESS_MANAGER: {
    id: "BusinessManager",
    label: "Business Manager",
    title: "Business Manager",
    name: "Insides Sales",
    email: "manager@comparedegree.com",
    password: "password123",
    avatar: "NK",
    permissions: {
      canDeleteLeads: false,
      canBulkManage: true,
      canAssignCounsellor: true,
      canExport: true,
      viewAllLeads: true,
    },
  },
  UNIT_HEAD: {
    id: "UnitHead",
    label: "Unit Head (College)",
    title: "Unit Head",
    name: "Navneet",
    email: "unithead@comparedegree.com",
    password: "password123",
    avatar: "RS",
    permissions: {
      canDeleteLeads: false,
      canBulkManage: true,
      canAssignCounsellor: true,
      canExport: true,
      viewAllLeads: false, // Could be restricted to their college unit
    },
  },
  COUNSELLOR: {
    id: "Counsellor",
    label: "Counsellor",
    title: "Senior Admissions Counsellor",
    name: "Rahul Giri",
    email: "counsellor@comparedegree.com",
    password: "password123",
    avatar: "PS",
    permissions: {
      canDeleteLeads: false,
      canBulkManage: false,
      canAssignCounsellor: false,
      canExport: false,
      viewAllLeads: false, // filter to Priya Sharma + unassigned
    },
  },
};

export const CENTERS = [
  "Unit Name Inside Sales"
];

export const COUNSELLORS = [
  { name: "Priya Sharma", email: "priya.sharma@comparedegree.com", center: "North Campus Delhi", phone: "+91 98112 34501" },
  { name: "Rahul Verma", email: "rahul.verma@comparedegree.com", center: "Bengaluru Central", phone: "+91 98112 34502" },
  { name: "Ananya Sen", email: "ananya.sen@comparedegree.com", center: "Kolkata Salt Lake", phone: "+91 98112 34503" },
  { name: "Rohan Mehta", email: "rohan.mehta@comparedegree.com", center: "Mumbai South", phone: "+91 98112 34504" },
  { name: "Sneha Patil", email: "sneha.patil@comparedegree.com", center: "Pune Hinjewadi", phone: "+91 98112 34505" },
  { name: "Amitav Roy", email: "amitav.roy@comparedegree.com", center: "Hyderabad Tech Hub", phone: "+91 98112 34506" },
];

export const COLLEGES = [
  "Shoolini University"
];

export const COURSES = [
  "Premium MBA",
  "MBA",
  "MCA",
  "M.Com",
  "MSC Data Science",
  "MA English Literature",
  "MAJMC",
  "BBA",
  "BCA",
  "B.Com (HONS)",
  "Others"
];

const currentYear = new Date().getFullYear();


export const LEAD_SOURCES = [
  "CompareDegree.com Portal",
  "Google Search Ad",
  "Instagram Campaign",
  "National Edu Fair 2026",
  "Student Alumni Referral",
  "Walk-in Center Visit",
  "CompareDegree Webinar",
];

