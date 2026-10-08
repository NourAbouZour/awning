import type { Metadata } from "next";
import Link from "next/link";
import { LayoutDashboard, Inbox, LogOut, Store, Shield } from "lucide-react";
import { requireSuperadmin } from "@/lib/auth";
import { logout } from "@/app/(auth)/actions";

export const metadata: Metadata = { title: "Admin · Awning" };
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
  await requireSuperadmin();

  return (
    <div className="flex min-h-dvh bg-canvas">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-ink text-white/90 lg:flex">
        <div className="flex h-16 items-center gap-2 px-6 font-display text-lg font-bold text-white">
          <Shield className="size-5" />
          Awning Admin
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
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t border-white/10 p-3">
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
          <nav className="flex gap-3 text-[13px]">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="hover:underline">
                {item.label}
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
