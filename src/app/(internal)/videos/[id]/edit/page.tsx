import { notFound, redirect } from "next/navigation";
import { getActorOrRedirect, ForbiddenError } from "@/lib/rbac";
import { getVideo, listEditorOptions } from "@/lib/services/video-service";
import { listScripts } from "@/lib/services/script-service";
import { canManageVideos } from "@/lib/permissions";
import { VideoForm } from "../../video-form";
import { updateVideoAction } from "../../actions";

function toDateInputValue(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "";
}

export default async function EditVideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await getActorOrRedirect();
  if (!canManageVideos(actor)) redirect(`/videos/${id}`);

  const video = await getVideo(actor, id).catch((e) => {
    if (e instanceof ForbiddenError) return null;
    throw e;
  });
  if (!video) notFound();

  const [scripts, editors] = await Promise.all([listScripts(actor), listEditorOptions()]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Edit {video.title}</h1>
      <VideoForm
        action={updateVideoAction.bind(null, id)}
        scripts={scripts}
        editors={editors}
        submitLabel="Save changes"
        defaultValues={{
          scriptId: video.scriptId,
          shootId: video.shootId ?? "",
          editorId: video.editorId ?? "",
          title: video.title,
          status: video.status,
          deadline: toDateInputValue(video.deadline),
        }}
      />
    </div>
  );
}
