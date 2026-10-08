import Link from "next/link";
import { AwningLogo } from "@/components/awning-logo";

const columns = [
  {
    title: "Product",
    links: [
      { label: "What you get", href: "/#features" },
      { label: "Pricing", href: "/pricing" },
      { label: "Example stores", href: "/#stores" },
    ],
  },
  {
    title: "Sellers",
    links: [
      { label: "Start a store", href: "/signup" },
      { label: "Log in", href: "/login" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/#story" },
      { label: "Contact", href: "mailto:hello@awning.shop" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-paper">
      <div className="mx-auto max-w-6xl px-5 py-14 md:px-8">
        <div className="flex flex-col justify-between gap-10 md:flex-row">
          <div className="max-w-xs">
            <AwningLogo />
            <p className="mt-4 text-sm leading-relaxed text-ink-soft">
              The simplest way to put your shop on the internet. Your products,
              your brand, your customers — live in minutes.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            {columns.map((col) => (
              <div key={col.title}>
                <h3 className="text-sm font-semibold text-ink">{col.title}</h3>
                <ul className="mt-3.5 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        className="text-sm text-ink-soft transition-colors hover:text-ink"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-line pt-6 text-xs text-ink-soft sm:flex-row sm:justify-between">
          <p>© 2026 Awning, Inc. A demo platform.</p>
          <p>Open for business, everywhere.</p>
        </div>
      </div>
    </footer>
  );
}
