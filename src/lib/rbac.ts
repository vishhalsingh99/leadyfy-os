import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import type { SystemRole, EmployeeRole } from "@prisma/client";

export type Actor = {
  profileId: string;
  authUserId: string;
  email: string;
  name: string;
  role: SystemRole;
  employeeId: string | null;
  employeeRole: EmployeeRole | null;
  clientId: string | null;
};

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

// For business-rule rejections that aren't about who's asking (e.g.
// double-booking a creator) — distinct from ForbiddenError so callers can
// tell "you can't do this" apart from "this specific action conflicts".
export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

// The single place that turns a Supabase session into the actor context
// every service function authorizes against. Looked up by authUserId on
// every call rather than trusted from a JWT claim, so a role change takes
// effect immediately instead of waiting for token refresh.
//
// Wrapped in React's cache() because the layout, the page, and often a
// service call within that page each call this independently — without
// memoization that's a Supabase auth round-trip plus a Prisma query
// repeated 2-3x per single page load. cache() dedupes all of that down to
// one call per request.
export const getActor = cache(async (): Promise<Actor | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;

  const profile = await prisma.profile.findUnique({
    where: { authUserId: data.user.id },
    include: { employee: true, client: true },
  });
  if (!profile || !profile.isActive) return null;

  return {
    profileId: profile.id,
    authUserId: profile.authUserId,
    email: profile.email,
    name: profile.name,
    role: profile.role,
    employeeId: profile.employee?.id ?? null,
    employeeRole: profile.employee?.employeeRole ?? null,
    clientId: profile.client?.id ?? null,
  };
});

export async function getActorOrRedirect(): Promise<Actor> {
  const actor = await getActor();
  if (!actor) redirect("/login");
  return actor;
}

export function requireRole(actor: Actor, ...allowed: SystemRole[]): Actor {
  if (!allowed.includes(actor.role)) {
    throw new ForbiddenError(`Role ${actor.role} cannot access this resource`);
  }
  return actor;
}

// Owner/Admin bypass sub-role checks entirely — they see everything an
// Employee module exposes, per spec section 2.
export function requireEmployeeRole(actor: Actor, ...allowed: EmployeeRole[]): Actor {
  if (actor.role === "OWNER" || actor.role === "ADMIN") return actor;
  if (actor.role !== "EMPLOYEE" || !actor.employeeRole || !allowed.includes(actor.employeeRole)) {
    throw new ForbiddenError(`Employee role ${actor.employeeRole} cannot access this resource`);
  }
  return actor;
}
