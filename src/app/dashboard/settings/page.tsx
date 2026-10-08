import { redirect } from "next/navigation";
import { requireCurrentStore, getCurrentUser } from "@/lib/auth";
import { getStoreForUser } from "@/server/stores";
import type { Plan } from "@/lib/plan";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const store = await requireCurrentStore();
  const [full, user] = await Promise.all([
    getStoreForUser(store.userId),
    getCurrentUser(),
  ]);
  if (!full) redirect("/onboarding");
  return (
    <SettingsClient
      store={full}
      plan={(user?.plan as Plan) ?? "stall"}
      billingPaid={user?.billingPaid ?? false}
    />
  );
}
