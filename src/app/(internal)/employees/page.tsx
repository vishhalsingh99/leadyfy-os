import { redirect } from "next/navigation";
import { getActorOrRedirect } from "@/lib/rbac";
import { listEmployees } from "@/lib/services/employee-service";
import { canViewEmployees } from "@/lib/permissions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";

export default async function EmployeesPage() {
  const actor = await getActorOrRedirect();
  if (!canViewEmployees(actor)) redirect("/dashboard");

  const employees = await listEmployees(actor);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Employees</h1>
        <p className="text-sm text-muted-foreground">
          {employees.length} employee{employees.length === 1 ? "" : "s"}
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((employee) => (
            <TableRow key={employee.id}>
              <TableCell className="font-medium">{employee.profile.name}</TableCell>
              <TableCell>{employee.profile.email}</TableCell>
              <TableCell>
                <StatusBadge status={employee.employeeRole} />
              </TableCell>
              <TableCell>{employee.phone ?? "—"}</TableCell>
              <TableCell>
                {employee.profile.isActive ? (
                  <span className="text-emerald-400">Active</span>
                ) : (
                  <span className="text-red-400">Inactive</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
