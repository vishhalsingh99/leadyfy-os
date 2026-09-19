import Link from "next/link";
import { redirect } from "next/navigation";
import { getActorOrRedirect } from "@/lib/rbac";
import { listExpenses } from "@/lib/services/expense-service";
import { canManageFinancials } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils/format";

export default async function ExpensesPage() {
  const actor = await getActorOrRedirect();
  if (!canManageFinancials(actor)) redirect("/dashboard");

  const expenses = await listExpenses(actor);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Expenses</h1>
          <p className="text-sm text-muted-foreground">
            {expenses.length} expense{expenses.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button render={<Link href="/expenses/new">New expense</Link>} />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Category</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Date</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => (
            <TableRow key={expense.id}>
              <TableCell className="font-medium">{expense.category}</TableCell>
              <TableCell>{expense.description ?? "—"}</TableCell>
              <TableCell>{formatCurrency(expense.amount)}</TableCell>
              <TableCell className="text-muted-foreground">{expense.incurredAt.toLocaleDateString()}</TableCell>
              <TableCell>
                <Link href={`/expenses/${expense.id}/edit`} className="text-primary hover:underline">
                  Edit
                </Link>
              </TableCell>
            </TableRow>
          ))}
          {expenses.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No expenses recorded yet.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}
