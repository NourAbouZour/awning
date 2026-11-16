import { redirect } from "next/navigation";
import {
  requireCurrentStore,
  getCurrentUser,
  getCurrentPlan,
  isStoreOwner,
} from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getStoreById } from "@/server/stores";
import type { Plan } from "@/lib/plan";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const store = await requireCurrentStore();
  const [full, user, plan, owner] = await Promise.all([
    getStoreById(store.id),
    getCurrentUser(),
    getCurrentPlan(),
    isStoreOwner(),
  ]);
  if (!full) redirect("/onboarding");
  const ownerRow = await prisma.user.findUnique({
    where: { id: store.userId },
    select: { billingPaid: true, requestedPlan: true },
  });
  return (
    <SettingsClient
      store={full}
      plan={plan}
      requestedPlan={(ownerRow?.requestedPlan as Plan | null) ?? null}
      billingPaid={ownerRow?.billingPaid ?? user?.billingPaid ?? false}
      isOwner={owner}
    />
  );
}
