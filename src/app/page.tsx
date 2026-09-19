import { redirect } from "next/navigation";
import { getActor } from "@/lib/rbac";

export default async function Home() {
  const actor = await getActor();
  if (!actor) redirect("/login");
  redirect(actor.role === "CLIENT" ? "/portal" : "/dashboard");
}
