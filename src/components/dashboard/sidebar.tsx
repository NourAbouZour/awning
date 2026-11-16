"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ChevronsUpDown,
  Code2,
  ExternalLink,
  FolderOpen,
  Globe,
  Home,
  Inbox,
  LifeBuoy,
  LogOut,
  Mail,
  Menu,
  Newspaper,
  Package,
  Paintbrush,
  Plus,
  Settings,
  Shield,
  ShoppingBasket,
  ShoppingCart,
  Tag,
  UserCog,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/app/(auth)/actions";
import { switchStore } from "@/app/dashboard/store-actions";
import { hasFeature, type Feature, type Plan } from "@/lib/plan";
import { cn } from "@/lib/utils";

export interface SidebarStore {
  id: string;
  name: string;
  slug: string;
  brandColor: string;
}

export interface SidebarContext {
  plan: Plan;
  isOwner: boolean;
  /** The platform owner, who also gets a link back to the admin panel. */
  isAdmin: boolean;
  stores: { id: string; name: string; slug: string }[];
}

export interface SidebarProps {
  store: SidebarStore;
  unread: number;
  ctx: SidebarContext;
}

interface NavItem {
  href: string;
  label: string;
  icon: typeof Home;
  exact?: boolean;
  badge?: number;
  /** Paid feature: the page is listed only when the plan includes it. */
  feature?: Feature;
  ownerOnly?: boolean;
}

function buildNav(unread: number, ctx: SidebarContext): NavItem[] {
  const items: NavItem[] = [
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
    { href: "/dashboard/subscribers", label: "Newsletter", icon: Newspaper },
    { href: "/dashboard/design", label: "Store design", icon: Paintbrush },
    {
      href: "/dashboard/discounts",
      label: "Discount codes",
      icon: Tag,
      feature: "discounts",
    },
    {
      href: "/dashboard/email",
      label: "Email marketing",
      icon: Mail,
      feature: "emailMarketing",
    },
    {
      href: "/dashboard/abandoned",
      label: "Abandoned carts",
      icon: ShoppingBasket,
      feature: "abandonedCart",
    },
    {
      href: "/dashboard/custom-domain",
      label: "Custom domain",
      icon: Globe,
      feature: "customDomain",
    },
    {
      href: "/dashboard/analytics",
      label: "Analytics",
      icon: BarChart3,
      feature: "analytics",
    },
    {
      href: "/dashboard/staff",
      label: "Staff",
      icon: UserCog,
      feature: "staff",
      ownerOnly: true,
    },
    {
      href: "/dashboard/developers",
      label: "API & webhooks",
      icon: Code2,
      feature: "api",
      ownerOnly: true,
    },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
    { href: "/dashboard/contact", label: "Contact Shopleb", icon: LifeBuoy },
  ];
  // Paid pages appear only once the store's plan includes them.
  return items.filter(
    (i) =>
      (!i.ownerOnly || ctx.isOwner) &&
      (!i.feature || hasFeature(ctx.plan, i.feature)),
  );
}

function NavLinks({
  unread,
  ctx,
  onNavigate,
}: {
  unread: number;
  ctx: SidebarContext;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const nav = buildNav(unread, ctx);
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
            <span className="truncate">{item.label}</span>
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

function StoreSwitcher({
  store,
  ctx,
}: {
  store: SidebarStore;
  ctx: SidebarContext;
}) {
  const canAdd = ctx.isOwner && hasFeature(ctx.plan, "multiStore");
  if (!canAdd && ctx.stores.length < 2) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="mb-1 flex w-full items-center justify-between rounded-lg border border-line px-3 py-2 text-[12px] font-medium text-ink-body transition-colors hover:bg-ink/4"
        >
          Switch store
          <ChevronsUpDown className="size-3.5 text-ink-soft" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {ctx.stores.map((s) => (
          <DropdownMenuItem
            key={s.id}
            onSelect={() => {
              if (s.id !== store.id) void switchStore(s.id);
            }}
          >
            <span className="flex-1 truncate">{s.name}</span>
            {s.id === store.id && (
              <span className="text-[11px] text-ink-soft">Current</span>
            )}
          </DropdownMenuItem>
        ))}
        {canAdd && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/onboarding?new=1">
                <Plus className="size-3.5" />
                Open another store
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function StoreFooter({
  store,
  ctx,
}: {
  store: SidebarStore;
  ctx: SidebarContext;
}) {
  return (
    <div className="mt-auto border-t border-line p-3">
      <StoreSwitcher store={store} ctx={ctx} />
      {ctx.isAdmin && (
        <Link
          href="/admin"
          className="mb-1 flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-ink-body transition-colors hover:bg-ink/4 hover:text-ink"
        >
          <Shield className="size-4 text-ink-soft" />
          Shopleb admin
        </Link>
      )}
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
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-ink">
            {store.name}
          </span>
          <span className="block truncate text-[11px] text-ink-soft">
            shopleb.com/s/{store.slug}
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

export function DashboardSidebar({ store, unread, ctx }: SidebarProps) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col overflow-y-auto border-r border-line bg-paper lg:flex">
      <div className="flex h-16 shrink-0 items-center px-6">
        <Link href="/" aria-label="Shopleb home">
          <AwningLogo size="sm" />
        </Link>
      </div>
      <NavLinks unread={unread} ctx={ctx} />
      <StoreFooter store={store} ctx={ctx} />
    </aside>
  );
}

export function DashboardMobileBar({ store, unread, ctx }: SidebarProps) {
  return (
    <div className="flex h-14 items-center justify-between border-b border-line bg-paper px-4 lg:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Open navigation">
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-72 max-w-[85vw] overflow-y-auto bg-paper"
        >
          <SheetTitle className="sr-only">Dashboard navigation</SheetTitle>
          <div className="flex h-16 items-center px-6">
            <AwningLogo size="sm" />
          </div>
          <SheetClose asChild>
            <div>
              <NavLinks unread={unread} ctx={ctx} />
            </div>
          </SheetClose>
          <StoreFooter store={store} ctx={ctx} />
        </SheetContent>
      </Sheet>
      <AwningLogo size="sm" />
      <span className="w-8" aria-hidden />
    </div>
  );
}
