import type { SystemRole } from "@prisma/client";

export type NavItem = {
  href: string;
  label: string;
  roles: SystemRole[];
};

// Drives the internal sidebar. Financial modules (Payments/Expenses/
// CreatorPayouts) and system-admin screens (Users/ActivityLogs) are Owner+
// Admin only per spec section 2 — Employees have zero visibility into them,
// not just a scoped-empty list, so they're excluded here rather than shown
// and 403'd.
export const internalNavItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", roles: ["OWNER", "ADMIN", "EMPLOYEE"] },
  { href: "/clients", label: "Clients", roles: ["OWNER", "ADMIN", "EMPLOYEE"] },
  { href: "/orders", label: "Orders", roles: ["OWNER", "ADMIN", "EMPLOYEE"] },
  { href: "/scripts", label: "Scripts", roles: ["OWNER", "ADMIN", "EMPLOYEE"] },
  { href: "/creators", label: "Creators", roles: ["OWNER", "ADMIN", "EMPLOYEE"] },
  { href: "/shoots", label: "Shoots", roles: ["OWNER", "ADMIN", "EMPLOYEE"] },
  { href: "/videos", label: "Videos", roles: ["OWNER", "ADMIN", "EMPLOYEE"] },
  { href: "/tasks", label: "Tasks", roles: ["OWNER", "ADMIN", "EMPLOYEE"] },
  { href: "/support-tickets", label: "Support Tickets", roles: ["OWNER", "ADMIN", "EMPLOYEE"] },
  { href: "/payments", label: "Payments", roles: ["OWNER", "ADMIN"] },
  { href: "/expenses", label: "Expenses", roles: ["OWNER", "ADMIN"] },
  { href: "/creator-payouts", label: "Creator Payouts", roles: ["OWNER", "ADMIN"] },
  { href: "/employees", label: "Employees", roles: ["OWNER", "ADMIN"] },
  { href: "/users", label: "Users & RBAC", roles: ["OWNER"] },
  { href: "/activity-logs", label: "Activity Logs", roles: ["OWNER"] },
];
