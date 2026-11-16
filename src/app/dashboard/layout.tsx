import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  DashboardMobileBar,
  DashboardSidebar,
} from "@/components/dashboard/sidebar";
import { TrialBar } from "@/components/dashboard/trial-bar";
import { getCurrentUser, getCurrentStore, getCurrentPlan } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Plan } from "@/lib/plan";

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

  const plan = await getCurrentPlan();
  const owner = await prisma.user.findUnique({
    where: { id: store.userId },
    select: { requestedPlan: true },
  });
  const isOwner = store.userId === user.id;
  // Arcade owners can switch between their stores.
  const ownedStores = isOwner
    ? await prisma.store.findMany({
        where: { userId: user.id },
        select: { id: true, name: true, slug: true },
        orderBy: { createdAt: "asc" },
      })
    : [];

  const sidebarStore = {
    id: store.id,
    name: store.name,
    slug: store.slug,
    brandColor: theme?.brandColor ?? "#114b32",
  };
  const sidebarCtx = {
    plan,
    isOwner,
    isAdmin: user.role === "superadmin",
    stores: ownedStores,
  };

  return (
    <div className="flex min-h-dvh bg-canvas">
      <DashboardSidebar store={sidebarStore} unread={unread} ctx={sidebarCtx} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TrialBar
          plan={plan}
          requestedPlan={(owner?.requestedPlan as Plan | null) ?? null}
        />
        <DashboardMobileBar store={sidebarStore} unread={unread} ctx={sidebarCtx} />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
