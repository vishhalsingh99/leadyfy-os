import { redirect } from "next/navigation";
import { getActorOrRedirect } from "@/lib/rbac";
import { listProfiles } from "@/lib/services/user-service";
import { canViewSystemAdmin } from "@/lib/permissions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { DeactivateButton } from "./deactivate-button";

export default async function UsersPage() {
  const actor = await getActorOrRedirect();
  if (!canViewSystemAdmin(actor)) redirect("/dashboard");

  const profiles = await listProfiles(actor);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Users &amp; RBAC</h1>
        <p className="text-sm text-muted-foreground">
          {profiles.length} user{profiles.length === 1 ? "" : "s"}
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Detail</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {profiles.map((profile) => (
            <TableRow key={profile.id}>
              <TableCell className="font-medium">{profile.name}</TableCell>
              <TableCell>{profile.email}</TableCell>
              <TableCell>
                <StatusBadge status={profile.role} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {profile.employee ? profile.employee.employeeRole.replaceAll("_", " ") : null}
                {profile.client ? profile.client.companyName : null}
              </TableCell>
              <TableCell>
                {profile.isActive ? (
                  <span className="text-emerald-400">Active</span>
                ) : (
                  <span className="text-red-400">Inactive</span>
                )}
              </TableCell>
              <TableCell>
                {profile.id === actor.profileId ? null : (
                  <DeactivateButton profileId={profile.id} isActive={profile.isActive} />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
