import type { Metadata } from "next";
import Link from "next/link";
import {
  LayoutDashboard,
  Inbox,
  LogOut,
  Store,
  Shield,
  ShoppingBag,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { requireSuperadmin } from "@/lib/auth";
import { logout } from "@/app/(auth)/actions";
import { adminWaiting } from "@/server/admin";

export const metadata: Metadata = { title: "Admin · Shopleb" };
export const dynamic = "force-dynamic";

const nav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/merchants", label: "Merchants", icon: Store },
  { href: "/admin/messages", label: "Messages", icon: Inbox },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireSuperadmin();
  const [waiting, ownStore] = await Promise.all([
    adminWaiting(),
    // The owner's account can run a shop of its own.
    prisma.store.findFirst({
      where: { userId: admin.id },
      select: { name: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  // What is waiting for the owner behind each menu item.
  const badges: Record<string, number> = {
    "/admin": waiting.planRequests + waiting.passwordResets,
    "/admin/messages": waiting.newMessages + waiting.passwordResets,
  };

  return (
    <div className="flex min-h-dvh bg-canvas">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-ink text-white/90 lg:flex">
        <div className="flex h-16 items-center gap-2 px-6 font-display text-lg font-bold text-white">
          <Shield className="size-5" />
          Shopleb Admin
        </div>
        <nav className="flex flex-col gap-0.5 px-3">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <item.icon className="size-4" />
              {item.label}
              {badges[item.href] > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-warn px-1.5 text-[11px] font-semibold text-white">
                  {badges[item.href]}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t border-white/10 p-3">
          {ownStore && (
            <Link
              href="/dashboard"
              className="mb-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <ShoppingBag className="size-4" />
              <span className="truncate">{ownStore.name} dashboard</span>
            </Link>
          )}
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <LogOut className="size-4" />
              Log out
            </button>
          </form>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-14 items-center justify-between border-b border-line bg-ink px-4 text-white lg:hidden">
          <span className="flex items-center gap-2 font-display font-bold">
            <Shield className="size-4" /> Admin
          </span>
          <nav className="flex flex-wrap justify-end gap-x-3 gap-y-1 text-[13px]">
            {ownStore && (
              <Link href="/dashboard" className="hover:underline">
                My store
              </Link>
            )}
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="hover:underline">
                {item.label}
                {badges[item.href] > 0 && (
                  <span className="ml-1 rounded-full bg-warn px-1.5 text-[11px] font-semibold text-white">
                    {badges[item.href]}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
