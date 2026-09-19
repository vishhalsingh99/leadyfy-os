import Link from "next/link";
import { getActorOrRedirect } from "@/lib/rbac";
import { listVideos, getEditorQueue } from "@/lib/services/video-service";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { canManageVideos } from "@/lib/permissions";

export default async function VideosPage() {
  const actor = await getActorOrRedirect();
  const videos = await listVideos(actor);
  const isEditor = actor.role === "EMPLOYEE" && actor.employeeRole === "EDITOR";
  const queue = isEditor ? await getEditorQueue(actor) : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Videos</h1>
          <p className="text-sm text-muted-foreground">
            {videos.length} video{videos.length === 1 ? "" : "s"}
          </p>
        </div>
        {canManageVideos(actor) ? (
          <Button render={<Link href="/videos/new">New video</Link>} />
        ) : null}
      </div>

      {queue ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Editor queue</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <QueueStat label="Overdue" count={queue.overdue.length} tone="danger" />
            <QueueStat label="Due today" count={queue.dueToday.length} tone="warning" />
            <QueueStat label="Due tomorrow" count={queue.dueTomorrow.length} tone="info" />
            <QueueStat label="Later / no deadline" count={queue.later.length} tone="neutral" />
          </CardContent>
        </Card>
      ) : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Client / Script</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Revisions</TableHead>
            <TableHead>Deadline</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {videos.map((video) => (
            <TableRow key={video.id}>
              <TableCell>
                <Link href={`/videos/${video.id}`} className="font-medium text-primary hover:underline">
                  {video.title}
                </Link>
              </TableCell>
              <TableCell>
                {video.script.order.client.companyName} — {video.script.title}
              </TableCell>
              <TableCell>
                <StatusBadge status={video.status} />
              </TableCell>
              <TableCell>{video.revisionCount}</TableCell>
              <TableCell className="text-muted-foreground">
                {video.deadline ? video.deadline.toLocaleDateString() : "—"}
              </TableCell>
            </TableRow>
          ))}
          {videos.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No videos in your scope yet.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}

const TONE_CLASSES: Record<string, string> = {
  danger: "text-red-400",
  warning: "text-orange-400",
  info: "text-sky-400",
  neutral: "text-muted-foreground",
};

function QueueStat({ label, count, tone }: { label: string; count: number; tone: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-xl font-semibold ${TONE_CLASSES[tone]}`}>{count}</span>
    </div>
  );
}
