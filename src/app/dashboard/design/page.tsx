import { redirect } from "next/navigation";
import { requireCurrentStore, currentHasFeature } from "@/lib/auth";
import { getStoreById } from "@/server/stores";
import { DesignClient } from "./design-client";

export default async function DesignPage() {
  const store = await requireCurrentStore();
  const full = await getStoreById(store.id);
  if (!full) redirect("/onboarding");
  return (
    <DesignClient
      initialStore={full}
      canHideBranding={await currentHasFeature("removeBranding")}
    />
  );
}
