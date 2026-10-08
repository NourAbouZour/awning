import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  DashboardMobileBar,
  DashboardSidebar,
} from "@/components/dashboard/sidebar";
import { TrialBar } from "@/components/dashboard/trial-bar";
import { getCurrentUser, getCurrentStore } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { trialStatus, type Plan } from "@/lib/plan";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.active) redirect("/login");

  const store = await getCurrentStore();
  if (!store) redirect("/onboarding");

  const theme = await prisma.storeTheme.findUnique({
    where: { storeId: store.id },
    select: { brandColor: true },
  });
  const unread = await prisma.contactMessage.count({
    where: { storeId: store.id, read: false },
  });

  const sidebarStore = {
    name: store.name,
    slug: store.slug,
    brandColor: theme?.brandColor ?? "#114b32",
  };

  const trial = trialStatus(store.createdAt);

  return (
    <div className="flex min-h-dvh bg-canvas">
      <DashboardSidebar store={sidebarStore} unread={unread} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TrialBar
          daysLeft={trial.daysLeft}
          active={trial.active}
          plan={user.plan as Plan}
          billingPaid={user.billingPaid}
        />
        <DashboardMobileBar store={sidebarStore} unread={unread} />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
