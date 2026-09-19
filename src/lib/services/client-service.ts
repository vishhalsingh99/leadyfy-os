import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ForbiddenError, requireRole, type Actor } from "@/lib/rbac";
import {
  createClientSchema,
  updateClientSchema,
  type CreateClientInput,
  type UpdateClientInput,
} from "@/lib/validations/client";

// The single place Client visibility is decided (spec section 4 + the plan
// doc's data-scoping rules). Every read below goes through this — there is
// no second code path that could leak an out-of-scope row.
function clientScopeFor(actor: Actor): Prisma.ClientWhereInput {
  if (actor.role === "OWNER" || actor.role === "ADMIN") return {};
  if (actor.role !== "EMPLOYEE") return { id: "__none__" };

  // Sales owns the lead-conversion funnel — they browse/create broadly,
  // not just clients already tied to one of their orders.
  if (actor.employeeRole === "SALES") return {};

  // Other employee sub-roles only see clients with work currently assigned
  // to them — enough context to do their job (which client a script/shoot/
  // video belongs to), nothing more.
  if (actor.employeeRole === "SCRIPT_WRITER") {
    return { orders: { some: { scripts: { some: { assignedToId: actor.employeeId } } } } };
  }
  if (actor.employeeRole === "SHOOT_MANAGER") {
    return {
      orders: { some: { scripts: { some: { shoots: { some: { managerId: actor.employeeId } } } } } },
    };
  }
  if (actor.employeeRole === "EDITOR") {
    return {
      orders: { some: { scripts: { some: { videos: { some: { editorId: actor.employeeId } } } } } },
    };
  }
  return { id: "__none__" };
}

function requireSalesWrite(actor: Actor) {
  requireRole(actor, "OWNER", "ADMIN", "EMPLOYEE");
  if (actor.role === "EMPLOYEE" && actor.employeeRole !== "SALES") {
    throw new ForbiddenError("Only Sales employees can manage clients");
  }
}

export async function listClients(actor: Actor) {
  requireRole(actor, "OWNER", "ADMIN", "EMPLOYEE");
  return prisma.client.findMany({
    where: clientScopeFor(actor),
    orderBy: { createdAt: "desc" },
  });
}

export async function getClient(actor: Actor, id: string) {
  requireRole(actor, "OWNER", "ADMIN", "EMPLOYEE");
  const client = await prisma.client.findFirst({ where: { id, ...clientScopeFor(actor) } });
  if (!client) throw new ForbiddenError("Client not found or not accessible");
  return client;
}

export async function createClient(actor: Actor, input: CreateClientInput) {
  requireSalesWrite(actor);
  const data = createClientSchema.parse(input);

  const client = await prisma.client.create({
    data: {
      companyName: data.companyName,
      contactName: data.contactName,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone || null,
      industry: data.industry || null,
      status: data.status,
    },
  });

  await prisma.activityLog.create({
    data: { profileId: actor.profileId, action: "CLIENT_CREATED", entityType: "Client", entityId: client.id },
  });

  return client;
}

export async function updateClient(actor: Actor, id: string, input: UpdateClientInput) {
  requireSalesWrite(actor);
  const existing = await prisma.client.findFirst({ where: { id, ...clientScopeFor(actor) } });
  if (!existing) throw new ForbiddenError("Client not found or not accessible");

  const data = updateClientSchema.parse(input);

  const client = await prisma.client.update({
    where: { id },
    data: {
      ...(data.companyName !== undefined && { companyName: data.companyName }),
      ...(data.contactName !== undefined && { contactName: data.contactName }),
      ...(data.contactEmail !== undefined && { contactEmail: data.contactEmail }),
      ...(data.contactPhone !== undefined && { contactPhone: data.contactPhone || null }),
      ...(data.industry !== undefined && { industry: data.industry || null }),
      ...(data.status !== undefined && { status: data.status }),
    },
  });

  await prisma.activityLog.create({
    data: { profileId: actor.profileId, action: "CLIENT_UPDATED", entityType: "Client", entityId: client.id },
  });

  return client;
}
