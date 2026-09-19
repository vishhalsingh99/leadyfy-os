import Link from "next/link";
import { getActorOrRedirect } from "@/lib/rbac";
import { listPortalOrders } from "@/lib/services/portal/order-service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";

export default async function PortalOrdersPage() {
  const actor = await getActorOrRedirect();
  const orders = await listPortalOrders(actor);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Your orders</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Package</TableHead>
            <TableHead>Videos</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Due</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell>
                <Link href={`/portal/orders/${order.id}`} className="font-medium text-primary hover:underline">
                  {order.packageName}
                </Link>
              </TableCell>
              <TableCell>{order.videoCount}</TableCell>
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
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                No orders yet.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}
