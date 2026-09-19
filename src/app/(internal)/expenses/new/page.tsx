import { redirect } from "next/navigation";
import { getActorOrRedirect } from "@/lib/rbac";
import { canManageFinancials } from "@/lib/permissions";
import { ExpenseForm } from "../expense-form";
import { createExpenseAction } from "../actions";

export default async function NewExpensePage() {
  const actor = await getActorOrRedirect();
  if (!canManageFinancials(actor)) redirect("/expenses");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">New expense</h1>
      <ExpenseForm action={createExpenseAction} submitLabel="Record expense" />
    </div>
  );
}
