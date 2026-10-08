import { redirect } from "next/navigation";
import { requireCurrentStore } from "@/lib/auth";
import { getStoreForUser } from "@/server/stores";
import { DesignClient } from "./design-client";

export default async function DesignPage() {
  const store = await requireCurrentStore();
  const full = await getStoreForUser(store.userId);
  if (!full) redirect("/onboarding");
  return <DesignClient initialStore={full} />;
}
