import { notFound, redirect } from "next/navigation";
import { getActorOrRedirect, ForbiddenError } from "@/lib/rbac";
import { getExpense } from "@/lib/services/expense-service";
import { canManageFinancials } from "@/lib/permissions";
import { ExpenseForm } from "../../expense-form";
import { updateExpenseAction } from "../../actions";

export default async function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await getActorOrRedirect();
  if (!canManageFinancials(actor)) redirect("/expenses");

  const expense = await getExpense(actor, id).catch((e) => {
    if (e instanceof ForbiddenError) return null;
    throw e;
  });
  if (!expense) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Edit expense</h1>
      <ExpenseForm
        action={updateExpenseAction.bind(null, id)}
        submitLabel="Save changes"
        defaultValues={{
          category: expense.category,
          description: expense.description ?? "",
          amount: Number(expense.amount),
          incurredAt: expense.incurredAt.toISOString().slice(0, 10),
        }}
      />
    </div>
  );
}
