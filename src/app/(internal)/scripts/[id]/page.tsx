import Link from "next/link";
import { notFound } from "next/navigation";
import { getActorOrRedirect, ForbiddenError } from "@/lib/rbac";
import { getScript } from "@/lib/services/script-service";
import { canManageScripts } from "@/lib/permissions";
import { SCRIPT_TRANSITIONS } from "@/lib/workflow/script-workflow";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { ScriptWorkflowActions } from "../script-workflow-actions";

export default async function ScriptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await getActorOrRedirect();

  const script = await getScript(actor, id).catch((e) => {
    if (e instanceof ForbiddenError) return null;
    throw e;
  });
  if (!script) notFound();

  const nextOptions = SCRIPT_TRANSITIONS[script.status];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{script.title}</h1>
          <StatusBadge status={script.status} />
        </div>
        {canManageScripts(actor) ? (
          <Button variant="outline" render={<Link href={`/scripts/${script.id}/edit`}>Edit</Link>} />
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Advance status</CardTitle>
        </CardHeader>
        <CardContent>
          {nextOptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">This is the final stage of the script workflow.</p>
          ) : (
            <ScriptWorkflowActions scriptId={script.id} options={nextOptions} />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Context</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            <Link href={`/clients/${script.order.clientId}`} className="text-primary hover:underline">
              {script.order.client.companyName}
            </Link>
            <Link href={`/orders/${script.order.id}`} className="text-muted-foreground hover:underline">
              {script.order.packageName}
            </Link>
            <div className="text-muted-foreground">
              Video #{script.videoNumber} · {script.language}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            <div>Revisions: {script.revisionCount}</div>
            <div className="text-muted-foreground">
              {script.deadline ? `Deadline ${script.deadline.toLocaleDateString()}` : "No deadline set"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Script content</CardTitle>
        </CardHeader>
        <CardContent className="whitespace-pre-wrap text-sm text-muted-foreground">
          {script.content}
        </CardContent>
      </Card>
    </div>
  );
}
