export const ADMISSION_STATUSES = {
  NEW_LEAD: {
    id: "New Lead",
    label: "New Lead",
    color: "text-blue-700",
    bg: "bg-blue-50/90",
    border: "border-blue-200",
    dot: "bg-blue-500",
    description: "Initial lead inquiry received, pending counsellor follow-up",
  },
  REGISTRATION_PAID: {
    id: "Registration Paid",
    label: "Registration Paid",
    color: "text-purple-700",
    bg: "bg-purple-50/90",
    border: "border-purple-200",
    dot: "bg-purple-500",
    description: "Registration / application fee paid by candidate",
  },
  PARTIALLY_FEE_COLLECTED: {
    id: "Partially Fee Collected",
    label: "Partially Fee Collected",
    color: "text-amber-700",
    bg: "bg-amber-50/90",
    border: "border-amber-200",
    dot: "bg-amber-500",
    description: "Initial installment or partial admission fee collected",
  },
  FEES_PAID: {
    id: "Fees Paid",
    label: "Fees Paid",
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
    description: "Documents & fees verified, admission confirmed & approved",
  },
};

export const ADMISSION_STATUS_LIST = [
  ADMISSION_STATUSES.NEW_LEAD,
  ADMISSION_STATUSES.REGISTRATION_PAID,
  ADMISSION_STATUSES.PARTIALLY_FEE_COLLECTED,
  ADMISSION_STATUSES.FEES_PAID,
  ADMISSION_STATUSES.ADMISSION_APPROVED,
];

// Non-enumerable aliases for backward compatibility so Object.values() and Object.keys() contain NO duplicates
Object.defineProperties(ADMISSION_STATUSES, {
  PENDING: { value: ADMISSION_STATUSES.NEW_LEAD, enumerable: false, configurable: true },
  FOLLOW_UP: { value: ADMISSION_STATUSES.REGISTRATION_PAID, enumerable: false, configurable: true },
  ADMITTED: { value: ADMISSION_STATUSES.ADMISSION_APPROVED, enumerable: false, configurable: true },
  NOT_INTERESTED: { value: ADMISSION_STATUSES.NEW_LEAD, enumerable: false, configurable: true },
  CANCELLED: { value: ADMISSION_STATUSES.NEW_LEAD, enumerable: false, configurable: true },
  LOST: { value: ADMISSION_STATUSES.NEW_LEAD, enumerable: false, configurable: true },
});

/**
 * Safely retrieve status metadata for a given status string.
 */
export function getAdmissionStatus(status) {
  if (!status) return ADMISSION_STATUSES.NEW_LEAD;
  const key = status.toUpperCase().replace(/[\s-]+/g, "_");
  if (ADMISSION_STATUSES[key]) {
    return ADMISSION_STATUSES[key];
  }
  // Standard fallbacks
  if (key === "PENDING") return ADMISSION_STATUSES.NEW_LEAD;
  if (key === "FOLLOW_UP") return ADMISSION_STATUSES.REGISTRATION_PAID;
  if (key === "ADMITTED") return ADMISSION_STATUSES.ADMISSION_APPROVED;
  return ADMISSION_STATUSES.NEW_LEAD;
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

export const BATCHES = [
  `January Intake ${currentYear}`,
  `July Intake ${currentYear}`,
  `January Intake ${currentYear + 1}`,
  `July Intake ${currentYear + 1}`,
];

export const LEAD_SOURCES = [
  "CompareDegree.com Portal",
  "Google Search Ad",
  "Instagram Campaign",
  "National Edu Fair 2026",
  "Student Alumni Referral",
  "Walk-in Center Visit",
  "CompareDegree Webinar",
];

