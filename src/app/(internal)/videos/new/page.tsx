import { redirect } from "next/navigation";
import { getActorOrRedirect } from "@/lib/rbac";
import { canManageVideos } from "@/lib/permissions";
import { listScripts } from "@/lib/services/script-service";
import { listEditorOptions } from "@/lib/services/video-service";
import { VideoForm } from "../video-form";
import { createVideoAction } from "../actions";

export default async function NewVideoPage() {
  const actor = await getActorOrRedirect();
  if (!canManageVideos(actor)) redirect("/videos");

  const [scripts, editors] = await Promise.all([listScripts(actor), listEditorOptions()]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">New video</h1>
      {scripts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No scripts in your scope yet.</p>
      ) : (
        <VideoForm action={createVideoAction} scripts={scripts} editors={editors} submitLabel="Create video" />
      )}
    </div>
  );
}
