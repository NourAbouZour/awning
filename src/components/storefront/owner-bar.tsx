import Link from "next/link";
import { Eye, FolderOpen, Package, Paintbrush, Plus } from "lucide-react";

/**
 * Shown at the very top of a storefront only when the signed-in user owns it.
 * Quick links into the dashboard editors; customers never see this.
 */
export function OwnerBar() {
  const actions = [
    { href: "/dashboard/products/new", label: "Add product", icon: Plus },
    { href: "/dashboard/products", label: "Products", icon: Package },
    { href: "/dashboard/categories", label: "Collections", icon: FolderOpen },
    { href: "/dashboard/design", label: "Edit look", icon: Paintbrush },
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-ink px-4 py-2 text-white">
      <span className="flex items-center gap-2 text-[13px] font-semibold">
        <span
          className="size-1.5 animate-pulse rounded-full bg-emerald-400"
          aria-hidden
        />
        Editing your store
      </span>
      <nav className="flex flex-wrap items-center gap-1">
        {actions.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[13px] font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white"
          >
            <a.icon className="size-3.5" />
            {a.label}
          </Link>
        ))}
      </nav>
      <Link
        href="/dashboard"
        className="ml-auto flex items-center gap-1.5 text-[13px] text-white/70 underline-offset-4 transition-colors hover:text-white hover:underline"
      >
        <Eye className="size-3.5" />
        Dashboard
      </Link>
    </div>
  );
}
