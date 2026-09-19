import "server-only";
import { prisma } from "@/lib/prisma";
import { requireRole, type Actor } from "@/lib/rbac";

// Read-only by design: creating a new Employee also means provisioning a
// new Supabase Auth user, which requires the service-role key (currently
// used only by prisma/seed.ts). Wiring that into a Server Action is a
// legitimate next step, not an oversight — documented in AUDIT.md.
export async function listEmployees(actor: Actor) {
  requireRole(actor, "OWNER", "ADMIN");
  return prisma.employee.findMany({
    include: { profile: true },
    orderBy: { createdAt: "asc" },
  });
}
