import Link from "next/link";
import { getActorOrRedirect } from "@/lib/rbac";
import { listPortalVideos } from "@/lib/services/portal/video-service";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";

export default async function PortalVideosPage() {
  const actor = await getActorOrRedirect();
  const videos = await listPortalVideos(actor);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Videos</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Revisions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {videos.map((video) => (
            <TableRow key={video.id}>
              <TableCell>
                <Link href={`/portal/videos/${video.id}`} className="font-medium text-primary hover:underline">
                  {video.title}
                </Link>
              </TableCell>
              <TableCell>
                <StatusBadge status={video.status} />
              </TableCell>
              <TableCell>{video.revisionCount}</TableCell>
            </TableRow>
          ))}
          {videos.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                No videos yet.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}
