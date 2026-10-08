"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, Search, ShoppingBag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCart } from "@/components/storefront/cart-context";
import { themeStyle } from "@/lib/store-theme";
import { cn, formatMoney } from "@/lib/utils";

export function StoreHeader() {
  const { store, count, setOpen } = useCart();
  const [scrolled, setScrolled] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const base = `/s/${store.slug}`;

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const nav = [
    { href: base, label: "Home" },
    { href: `${base}/shop`, label: "Shop" },
    { href: `${base}/contact`, label: "Contact" },
  ];

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 border-b transition-all duration-300",
          scrolled
            ? "border-sf-line bg-sf-bg/85 backdrop-blur-md"
            : "border-transparent bg-sf-bg"
        )}
      >
        <div
          className={cn(
            "mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 transition-all duration-300 md:px-8",
            scrolled ? "h-14" : "h-16 md:h-20"
          )}
        >
          {/* mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <button
                className="-ml-2 p-2 md:hidden"
                aria-label="Open menu"
              >
                <Menu className="size-5" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="full"
              className="storefront bg-sf-bg text-sf-ink"
              style={themeStyle(store.theme)}
            >
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <nav
                className="flex flex-col gap-1 px-6 pt-24"
                aria-label="Store menu"
              >
                {nav.map((item) => (
                  <SheetClose key={item.href} asChild>
                    <Link
                      href={item.href}
                      className="sf-display py-3 text-4xl transition-opacity hover:opacity-60"
                    >
                      {item.label}
                    </Link>
                  </SheetClose>
                ))}
              </nav>
              <p className="mt-auto px-6 pb-10 text-sm text-sf-muted">
                {store.shippingNote}
              </p>
            </SheetContent>
          </Sheet>

          {/* logo */}
          <Link
            href={base}
            className="min-w-0 shrink"
            aria-label={`${store.name} home`}
          >
            {store.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={store.logoUrl}
                alt={store.name}
                className="h-7 w-auto max-w-40 object-contain"
              />
            ) : (
              <span className="sf-display truncate text-xl font-bold tracking-tight md:text-2xl">
                {store.logoText}
              </span>
            )}
          </Link>

          {/* desktop nav */}
          <nav
            className="hidden items-center gap-8 md:flex"
            aria-label="Store"
          >
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium transition-opacity hover:opacity-60"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* actions */}
          <div className="flex items-center gap-1">
            <button
              className="p-2 transition-opacity hover:opacity-60"
              aria-label="Search products"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="size-5" />
            </button>
            <button
              className="relative p-2 transition-opacity hover:opacity-60"
              aria-label={`Open bag, ${count} ${count === 1 ? "item" : "items"}`}
              onClick={() => setOpen(true)}
            >
              <ShoppingBag className="size-5" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex size-4.5 items-center justify-center rounded-full bg-sf-brand text-[10px] font-bold text-sf-on-brand">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}

function SearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { store } = useCart();
  const [query, setQuery] = React.useState("");
  const base = `/s/${store.slug}`;

  const results = query.trim()
    ? store.products
        .filter(
          (p) =>
            p.status === "active" &&
            p.title.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 6)
    : [];

  function handleOpenChange(v: boolean) {
    if (!v) setQuery("");
    onOpenChange(v);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="storefront top-24 translate-y-0 bg-sf-bg p-0 text-sf-ink"
        style={themeStyle(store.theme)}
      >
        <DialogTitle className="sr-only">Search products</DialogTitle>
        <div className="flex items-center gap-3 border-b border-sf-line px-5 py-4">
          <Search className="size-4 text-sf-muted" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${store.name}…`}
            aria-label="Search products"
            className="w-full bg-transparent text-base outline-none placeholder:text-sf-muted"
          />
        </div>
        {query.trim() && (
          <div className="max-h-96 overflow-y-auto p-2">
            {results.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-sf-muted">
                Nothing matches “{query}” — try a different word.
              </p>
            ) : (
              <ul>
                {results.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`${base}/product/${p.slug}`}
                      onClick={() => onOpenChange(false)}
                      className="flex items-center gap-4 rounded-lg px-3 py-2.5 transition-colors hover:bg-sf-wash"
                    >
                      <span className="relative size-12 shrink-0 overflow-hidden rounded-md bg-sf-wash">
                        <Image
                          src={p.images[0]}
                          alt=""
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {p.title}
                        </span>
                        <span className="block text-xs text-sf-muted">
                          {formatMoney(p.price, store.currency)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
