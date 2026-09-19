import "server-only";
import { prisma } from "@/lib/prisma";
import { ForbiddenError, requireRole, type Actor } from "@/lib/rbac";
import {
  createExpenseSchema,
  updateExpenseSchema,
  type CreateExpenseInput,
  type UpdateExpenseInput,
} from "@/lib/validations/expense";

function requireFinancialAccess(actor: Actor) {
  requireRole(actor, "OWNER", "ADMIN");
}

export async function listExpenses(actor: Actor) {
  requireFinancialAccess(actor);
  return prisma.expense.findMany({ orderBy: { incurredAt: "desc" } });
}

export async function getExpense(actor: Actor, id: string) {
  requireFinancialAccess(actor);
  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) throw new ForbiddenError("Expense not found");
  return expense;
}

export async function createExpense(actor: Actor, input: CreateExpenseInput) {
  requireFinancialAccess(actor);
  const data = createExpenseSchema.parse(input);

  const expense = await prisma.expense.create({
    data: {
      category: data.category,
      description: data.description || null,
      amount: data.amount,
      incurredAt: new Date(data.incurredAt),
    },
  });

  await prisma.activityLog.create({
    data: { profileId: actor.profileId, action: "EXPENSE_RECORDED", entityType: "Expense", entityId: expense.id },
  });

  return expense;
}

export async function updateExpense(actor: Actor, id: string, input: UpdateExpenseInput) {
  requireFinancialAccess(actor);
  const data = updateExpenseSchema.parse(input);

  const expense = await prisma.expense.update({
    where: { id },
    data: {
      ...(data.category !== undefined && { category: data.category }),
      ...(data.description !== undefined && { description: data.description || null }),
      ...(data.amount !== undefined && { amount: data.amount }),
      ...(data.incurredAt !== undefined && { incurredAt: new Date(data.incurredAt) }),
    },
  });

  await prisma.activityLog.create({
    data: { profileId: actor.profileId, action: "EXPENSE_UPDATED", entityType: "Expense", entityId: expense.id },
  });

  return expense;
}
