import Link from "next/link";
import { getActorOrRedirect } from "@/lib/rbac";
import { listOrders } from "@/lib/services/order-service";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { canManageOrders } from "@/lib/permissions";
import { formatCurrency } from "@/lib/utils/format";

export default async function OrdersPage() {
  const actor = await getActorOrRedirect();
  const orders = await listOrders(actor);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Orders</h1>
          <p className="text-sm text-muted-foreground">
            {orders.length} order{orders.length === 1 ? "" : "s"}
          </p>
        </div>
        {canManageOrders(actor) ? (
          <Button render={<Link href="/orders/new">New order</Link>} />
        ) : null}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Package</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Videos</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Due</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell>
                <Link href={`/orders/${order.id}`} className="font-medium text-primary hover:underline">
                  {order.packageName}
                </Link>
              </TableCell>
              <TableCell>{order.client.companyName}</TableCell>
              <TableCell>{order.videoCount}</TableCell>
              <TableCell>{formatCurrency(order.totalValue)}</TableCell>
              <TableCell>
                <StatusBadge status={order.status} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {order.dueDate ? order.dueDate.toLocaleDateString() : "—"}
              </TableCell>
            </TableRow>
          ))}
          {orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                No orders in your scope yet.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}
