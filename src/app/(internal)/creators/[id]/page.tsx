import Link from "next/link";
import { notFound } from "next/navigation";
import { getActorOrRedirect, ForbiddenError } from "@/lib/rbac";
import { getCreator } from "@/lib/services/creator-service";
import { canManageCreators, canViewCreatorRates } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { formatCurrency } from "@/lib/utils/format";
import { AvailabilityQuickSet } from "../availability-quick-set";

export default async function CreatorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await getActorOrRedirect();

  const creator = await getCreator(actor, id).catch((e) => {
    if (e instanceof ForbiddenError) return null;
    throw e;
  });
  if (!creator) notFound();

  const canManage = canManageCreators(actor);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{creator.name}</h1>
        {canManage ? (
          <Button variant="outline" render={<Link href={`/creators/${creator.id}/edit`}>Edit</Link>} />
        ) : null}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            <div>{creator.email}</div>
            <div className="text-muted-foreground">{creator.phone ?? "No phone on file"}</div>
            <div className="text-muted-foreground">{creator.city ?? "—"}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            <div>Languages: {creator.languages ?? "—"}</div>
            <div>Niches: {creator.niches ?? "—"}</div>
            {canViewCreatorRates(actor) ? (
              <div className="text-muted-foreground">Rate: {formatCurrency(creator.ratePerVideo)}/video</div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Availability</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {canManage ? <AvailabilityQuickSet creatorId={creator.id} /> : null}
          <div className="flex flex-wrap gap-2">
            {creator.availability.length === 0 ? (
              <span className="text-sm text-muted-foreground">No availability recorded yet.</span>
            ) : (
              creator.availability.map((a) => (
                <div key={a.id} className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5">
                  <span className="text-sm">{a.date.toLocaleDateString()}</span>
                  <StatusBadge status={a.status} />
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
