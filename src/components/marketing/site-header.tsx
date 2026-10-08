"use client";

import * as React from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { AwningLogo } from "@/components/awning-logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/#features", label: "What you get" },
  { href: "/pricing", label: "Pricing" },
  { href: "/#stores", label: "Example stores" },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-all duration-300",
        scrolled
          ? "border-b border-line bg-canvas/85 backdrop-blur-md"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:px-8">
        <Link href="/" className="shrink-0" aria-label="Awning home">
          <AwningLogo />
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Main">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-ink-body transition-colors hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Log in</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/signup">Start your store free</Link>
          </Button>
        </div>

        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="full" className="bg-canvas">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <div className="flex h-16 items-center px-5">
              <AwningLogo />
            </div>
            <nav
              className="flex flex-col gap-1 px-5 pt-6"
              aria-label="Mobile main"
            >
              {nav.map((item) => (
                <SheetClose key={item.href} asChild>
                  <Link
                    href={item.href}
                    className="rounded-lg px-3 py-3.5 font-display text-2xl font-semibold text-ink transition-colors hover:bg-ink/5"
                  >
                    {item.label}
                  </Link>
                </SheetClose>
              ))}
            </nav>
            <div className="mt-auto flex flex-col gap-3 p-5 pb-10">
              <Button variant="outline" size="lg" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button size="lg" asChild>
                <Link href="/signup">Start your store free</Link>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
