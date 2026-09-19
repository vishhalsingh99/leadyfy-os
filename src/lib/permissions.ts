import type { Actor } from "@/lib/rbac";

// UI-only helpers for conditionally showing actions (e.g. "New client").
// These are a convenience, not the security boundary — every service
// function re-checks permissions itself regardless of what the UI shows.
export function canManageClients(actor: Actor): boolean {
  if (actor.role === "OWNER" || actor.role === "ADMIN") return true;
  return actor.role === "EMPLOYEE" && actor.employeeRole === "SALES";
}

export function canManageOrders(actor: Actor): boolean {
  return canManageClients(actor);
}

export function canManageScripts(actor: Actor): boolean {
  if (actor.role === "OWNER" || actor.role === "ADMIN") return true;
  return actor.role === "EMPLOYEE" && actor.employeeRole === "SCRIPT_WRITER";
}

export function canManageCreators(actor: Actor): boolean {
  if (actor.role === "OWNER" || actor.role === "ADMIN") return true;
  return actor.role === "EMPLOYEE" && actor.employeeRole === "SHOOT_MANAGER";
}

// Creators are visible to every internal role (shared resource pool), but
// the rate card is only meaningful to people who handle creator payouts or
// booking — hidden from Sales/Script Writer/Editor views, not by filtering
// the row, just by not rendering the column/field.
export function canViewCreatorRates(actor: Actor): boolean {
  return canManageCreators(actor);
}

export function canManageShoots(actor: Actor): boolean {
  return canManageCreators(actor);
}

export function canManageVideos(actor: Actor): boolean {
  if (actor.role === "OWNER" || actor.role === "ADMIN") return true;
  return actor.role === "EMPLOYEE" && actor.employeeRole === "EDITOR";
}

// Anyone can create a task; only Owner/Admin or the assignee can edit one —
// this one takes the task because, unlike the others above, it's not a
// pure role check.
export function canEditTask(actor: Actor, task: { assigneeId: string | null }): boolean {
  if (actor.role === "OWNER" || actor.role === "ADMIN") return true;
  return task.assigneeId === actor.profileId;
}

// Financial ledgers — Owner/Admin only, no Employee sub-role has access.
export function canManageFinancials(actor: Actor): boolean {
  return actor.role === "OWNER" || actor.role === "ADMIN";
}

export function canResolveSupportTickets(actor: Actor): boolean {
  return actor.role === "OWNER" || actor.role === "ADMIN";
}

export function canViewEmployees(actor: Actor): boolean {
  return actor.role === "OWNER" || actor.role === "ADMIN";
}

// Owner-exclusive: RBAC config and system-wide activity logs (spec section 2).
export function canViewSystemAdmin(actor: Actor): boolean {
  return actor.role === "OWNER";
}
