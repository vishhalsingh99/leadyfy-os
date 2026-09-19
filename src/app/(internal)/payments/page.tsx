import Link from "next/link";
import { redirect } from "next/navigation";
import { getActorOrRedirect } from "@/lib/rbac";
import { listPayments } from "@/lib/services/payment-service";
import { canManageFinancials } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { formatCurrency } from "@/lib/utils/format";

export default async function PaymentsPage() {
  const actor = await getActorOrRedirect();
  if (!canManageFinancials(actor)) redirect("/dashboard");
  const payments = await listPayments(actor);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Payments</h1>
          <p className="text-sm text-muted-foreground">
            {payments.length} invoice{payments.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button render={<Link href="/payments/new">New payment</Link>} />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Client / Order</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Paid</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Due</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell>
                <Link href={`/payments/${payment.id}`} className="font-medium text-primary hover:underline">
                  {payment.invoiceNumber}
                </Link>
              </TableCell>
              <TableCell>
                {payment.order.client.companyName} — {payment.order.packageName}
              </TableCell>
              <TableCell>{formatCurrency(payment.amount)}</TableCell>
              <TableCell>{formatCurrency(payment.amountPaid)}</TableCell>
              <TableCell>
                <StatusBadge status={payment.status} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {payment.dueDate ? payment.dueDate.toLocaleDateString() : "—"}
              </TableCell>
            </TableRow>
          ))}
          {payments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No payments recorded yet.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}
