import { getActorOrRedirect } from "@/lib/rbac";
import { listPortalInvoices } from "@/lib/services/portal/invoice-service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { formatCurrency } from "@/lib/utils/format";

export default async function PortalInvoicesPage() {
  const actor = await getActorOrRedirect();
  const invoices = await listPortalInvoices(actor);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Invoices</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice #</TableHead>
            <TableHead>Order</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Paid</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Due</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
              <TableCell>{invoice.order.packageName}</TableCell>
              <TableCell>{formatCurrency(invoice.amount)}</TableCell>
              <TableCell>{formatCurrency(invoice.amountPaid)}</TableCell>
              <TableCell>
                <StatusBadge status={invoice.status} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {invoice.dueDate ? invoice.dueDate.toLocaleDateString() : "—"}
              </TableCell>
            </TableRow>
          ))}
          {invoices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No invoices yet.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}
