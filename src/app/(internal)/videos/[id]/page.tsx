import Link from "next/link";
import { notFound } from "next/navigation";
import { getActorOrRedirect, ForbiddenError } from "@/lib/rbac";
import { getVideo } from "@/lib/services/video-service";
import { canManageVideos } from "@/lib/permissions";
import { VIDEO_TRANSITIONS } from "@/lib/workflow/video-workflow";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { VideoWorkflowActions } from "../video-workflow-actions";

export default async function VideoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await getActorOrRedirect();

  const video = await getVideo(actor, id).catch((e) => {
    if (e instanceof ForbiddenError) return null;
    throw e;
  });
  if (!video) notFound();

  const nextOptions = VIDEO_TRANSITIONS[video.status];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{video.title}</h1>
          <StatusBadge status={video.status} />
        </div>
        {canManageVideos(actor) ? (
          <Button variant="outline" render={<Link href={`/videos/${video.id}/edit`}>Edit</Link>} />
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Advance status</CardTitle>
        </CardHeader>
        <CardContent>
          {nextOptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">This video has completed the pipeline.</p>
          ) : (
            <VideoWorkflowActions videoId={video.id} options={nextOptions} />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Context</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            <Link href={`/clients/${video.script.order.clientId}`} className="text-primary hover:underline">
              {video.script.order.client.companyName}
            </Link>
            <Link href={`/scripts/${video.scriptId}`} className="text-muted-foreground hover:underline">
              {video.script.title}
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            <div>Revisions: {video.revisionCount}</div>
            <div className="text-muted-foreground">
              {video.deadline ? `Deadline ${video.deadline.toLocaleDateString()}` : "No deadline set"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Client feedback</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          {video.feedback.length === 0 ? (
            <span className="text-muted-foreground">No feedback yet.</span>
          ) : (
            video.feedback.map((f) => (
              <div key={f.id} className="rounded-md border border-border p-3">
                <div className="text-muted-foreground text-xs">
                  {f.createdAt.toLocaleString()}
                  {f.timestampSec !== null ? ` · at ${f.timestampSec}s` : ""}
                </div>
                <div>{f.comment}</div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
