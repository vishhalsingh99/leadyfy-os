import type { Prisma } from "@prisma/client";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatCurrency(value: Prisma.Decimal | number | string): string {
  return currencyFormatter.format(Number(value));
}
