import { notFound } from "next/navigation";
import { getActorOrRedirect, ForbiddenError } from "@/lib/rbac";
import { getPortalScript } from "@/lib/services/portal/script-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { ScriptApprovalActions } from "../script-approval-actions";

export default async function PortalScriptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await getActorOrRedirect();

  const script = await getPortalScript(actor, id).catch((e) => {
    if (e instanceof ForbiddenError) return null;
    throw e;
  });
  if (!script) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">{script.title}</h1>
        <StatusBadge status={script.status} />
      </div>

      {script.status === "SENT_TO_CLIENT" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your review</CardTitle>
          </CardHeader>
          <CardContent>
            <ScriptApprovalActions scriptId={script.id} />
          </CardContent>
        </Card>
      ) : null}

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
