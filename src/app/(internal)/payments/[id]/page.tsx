import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getActorOrRedirect, ForbiddenError } from "@/lib/rbac";
import { getPayment } from "@/lib/services/payment-service";
import { canManageFinancials } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { formatCurrency } from "@/lib/utils/format";

export default async function PaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await getActorOrRedirect();
  if (!canManageFinancials(actor)) redirect("/dashboard");

  const payment = await getPayment(actor, id).catch((e) => {
    if (e instanceof ForbiddenError) return null;
    throw e;
  });
  if (!payment) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{payment.invoiceNumber}</h1>
          <StatusBadge status={payment.status} />
        </div>
        <Button variant="outline" render={<Link href={`/payments/${payment.id}/edit`}>Edit</Link>} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <Link href={`/orders/${payment.orderId}`} className="text-primary hover:underline">
              {payment.order.client.companyName} — {payment.order.packageName}
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Amounts</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            <div>Invoiced: {formatCurrency(payment.amount)}</div>
            <div>Paid: {formatCurrency(payment.amountPaid)}</div>
            <div className="text-muted-foreground">
              {payment.method ?? "No method on file"}
              {payment.transactionRef ? ` · ${payment.transactionRef}` : ""}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
