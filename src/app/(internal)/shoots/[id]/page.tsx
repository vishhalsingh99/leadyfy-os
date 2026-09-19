import Link from "next/link";
import { notFound } from "next/navigation";
import { getActorOrRedirect, ForbiddenError } from "@/lib/rbac";
import { getShoot } from "@/lib/services/shoot-service";
import { canManageShoots } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";

export default async function ShootDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await getActorOrRedirect();

  const shoot = await getShoot(actor, id).catch((e) => {
    if (e instanceof ForbiddenError) return null;
    throw e;
  });
  if (!shoot) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{shoot.script.title}</h1>
          <StatusBadge status={shoot.status} />
        </div>
        {canManageShoots(actor) ? (
          <Button variant="outline" render={<Link href={`/shoots/${shoot.id}/edit`}>Edit</Link>} />
        ) : null}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Context</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            <Link href={`/clients/${shoot.script.order.clientId}`} className="text-primary hover:underline">
              {shoot.script.order.client.companyName}
            </Link>
            <Link href={`/scripts/${shoot.scriptId}`} className="text-muted-foreground hover:underline">
              {shoot.script.title}
            </Link>
            <Link href={`/creators/${shoot.creatorId}`} className="text-muted-foreground hover:underline">
              Creator: {shoot.creator.name}
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Logistics</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            <div>{shoot.scheduledAt.toLocaleString()}</div>
            <div className="text-muted-foreground">{shoot.location ?? "No location set"}</div>
            {shoot.notes ? <div className="text-muted-foreground">{shoot.notes}</div> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
