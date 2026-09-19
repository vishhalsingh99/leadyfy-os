import { notFound } from "next/navigation";
import { getActorOrRedirect, ForbiddenError } from "@/lib/rbac";
import { getPortalVideo } from "@/lib/services/portal/video-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { VideoApprovalActions } from "../video-approval-actions";

export default async function PortalVideoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await getActorOrRedirect();

  const video = await getPortalVideo(actor, id).catch((e) => {
    if (e instanceof ForbiddenError) return null;
    throw e;
  });
  if (!video) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">{video.title}</h1>
        <StatusBadge status={video.status} />
      </div>

      {video.status === "CLIENT_REVIEW" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your review</CardTitle>
          </CardHeader>
          <CardContent>
            <VideoApprovalActions videoId={video.id} />
          </CardContent>
        </Card>
      ) : null}

      {video.status === "DELIVERED" && video.finalAssetId ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Final delivery</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Final asset reference: {video.finalAssetId}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Feedback history</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          {video.feedback.length === 0 ? (
            <span className="text-muted-foreground">No feedback yet.</span>
          ) : (
            video.feedback.map((f) => (
              <div key={f.id} className="rounded-md border border-border p-3">
                <div className="text-xs text-muted-foreground">
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
