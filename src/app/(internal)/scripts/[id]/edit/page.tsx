import { notFound, redirect } from "next/navigation";
import { getActorOrRedirect, ForbiddenError } from "@/lib/rbac";
import { getScript, listScriptWriterOptions } from "@/lib/services/script-service";
import { listOrders } from "@/lib/services/order-service";
import { canManageScripts } from "@/lib/permissions";
import { ScriptForm } from "../../script-form";
import { updateScriptAction } from "../../actions";

function toDateInputValue(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "";
}

export default async function EditScriptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await getActorOrRedirect();
  if (!canManageScripts(actor)) redirect(`/scripts/${id}`);

  const script = await getScript(actor, id).catch((e) => {
    if (e instanceof ForbiddenError) return null;
    throw e;
  });
  if (!script) notFound();

  const [orders, writers] = await Promise.all([listOrders(actor), listScriptWriterOptions()]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Edit {script.title}</h1>
      <ScriptForm
        action={updateScriptAction.bind(null, id)}
        orders={orders}
        writers={writers}
        submitLabel="Save changes"
        defaultValues={{
          orderId: script.orderId,
          assignedToId: script.assignedToId ?? "",
          videoNumber: script.videoNumber,
          title: script.title,
          content: script.content,
          language: script.language,
          status: script.status,
          deadline: toDateInputValue(script.deadline),
        }}
      />
    </div>
  );
}
