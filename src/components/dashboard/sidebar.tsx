"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ExternalLink,
  FolderOpen,
  Home,
  Inbox,
  LogOut,
  Mail,
  Menu,
  Package,
  Paintbrush,
  Settings,
  ShoppingCart,
  Users,
} from "lucide-react";
import { AwningLogo } from "@/components/awning-logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { logout } from "@/app/(auth)/actions";
import { cn } from "@/lib/utils";

export interface SidebarStore {
  name: string;
  slug: string;
  brandColor: string;
}

export interface SidebarProps {
  store: SidebarStore;
  unread: number;
}

function buildNav(unread: number) {
  return [
    { href: "/dashboard", label: "Home", icon: Home, exact: true },
    { href: "/dashboard/orders", label: "Orders", icon: ShoppingCart },
    { href: "/dashboard/products", label: "Products", icon: Package },
    { href: "/dashboard/categories", label: "Collections", icon: FolderOpen },
    { href: "/dashboard/customers", label: "Customers", icon: Users },
    {
      href: "/dashboard/messages",
      label: "Messages",
      icon: Inbox,
      badge: unread,
    },
    { href: "/dashboard/email", label: "Email marketing", icon: Mail },
    { href: "/dashboard/design", label: "Store design", icon: Paintbrush },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ];
}

function NavLinks({
  unread,
  onNavigate,
}: {
  unread: number;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const nav = buildNav(unread);
  return (
    <nav className="flex flex-col gap-0.5 px-3" aria-label="Dashboard">
      {nav.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
              active
                ? "bg-green-wash text-green"
                : "text-ink-body hover:bg-ink/4 hover:text-ink",
            )}
          >
            <item.icon
              className={cn("size-4", active ? "text-green" : "text-ink-soft")}
            />
            {item.label}
            {!!item.badge && (
              <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-green px-1.5 text-[11px] font-semibold text-white">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function StoreFooter({ store }: { store: SidebarStore }) {
  return (
    <div className="mt-auto border-t border-line p-3">
      <Link
        href={`/s/${store.slug}`}
        target="_blank"
        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-ink-body transition-colors hover:bg-ink/4"
      >
        <span
          className="flex size-7 items-center justify-center rounded-md text-[11px] font-bold text-white"
          style={{ background: store.brandColor }}
        >
          {store.name[0]}
        </span>
        <span className="flex-1">
          <span className="block font-medium text-ink">{store.name}</span>
          <span className="block text-[11px] text-ink-soft">
            {store.slug}.awning.shop
          </span>
        </span>
        <ExternalLink className="size-3.5 text-ink-soft" />
      </Link>
      <form action={logout}>
        <button
          type="submit"
          className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-ink-body transition-colors hover:bg-ink/4 hover:text-ink"
        >
          <LogOut className="size-4 text-ink-soft" />
          Log out
        </button>
      </form>
    </div>
  );
}

export function DashboardSidebar({ store, unread }: SidebarProps) {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-paper lg:flex">
      <div className="flex h-16 items-center px-6">
        <Link href="/" aria-label="Awning home">
          <AwningLogo size="sm" />
        </Link>
      </div>
      <NavLinks unread={unread} />
      <StoreFooter store={store} />
    </aside>
  );
}

export function DashboardMobileBar({ store, unread }: SidebarProps) {
  return (
    <div className="flex h-14 items-center justify-between border-b border-line bg-paper px-4 lg:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Open navigation">
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 max-w-[85vw] bg-paper">
          <SheetTitle className="sr-only">Dashboard navigation</SheetTitle>
          <div className="flex h-16 items-center px-6">
            <AwningLogo size="sm" />
          </div>
          <SheetClose asChild>
            <div>
              <NavLinks unread={unread} />
            </div>
          </SheetClose>
          <StoreFooter store={store} />
        </SheetContent>
      </Sheet>
      <AwningLogo size="sm" />
      <span className="w-8" aria-hidden />
    </div>
  );
}
