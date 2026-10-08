import Link from "next/link";
import { NewsletterForm } from "@/components/storefront/newsletter-form";
import type { Store } from "@/lib/types";

/* lucide no longer ships brand glyphs — tiny inline marks instead. */
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.9 1.2h3.7l-8.1 9.3L24 22.8h-7.5l-5.9-7.7-6.7 7.7H.2l8.6-9.9L0 1.2h7.7l5.3 7 6-7Zm-1.3 19.4h2L7.6 3.3h-2.2l12.2 17.3Z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19.6 7.1a5 5 0 0 1-3.5-1.4v6.9a5.9 5.9 0 1 1-5.9-5.9c.3 0 .7 0 1 .1v3a2.9 2.9 0 1 0 2 2.8V2h2.9a5 5 0 0 0 3.5 4.1v3Z" />
    </svg>
  );
}

export function StoreFooter({ store }: { store: Store }) {
  const base = `/s/${store.slug}`;
  const s = store.theme.socials;

  return (
    <footer className="border-t border-sf-line bg-sf-bg">
      <div className="mx-auto max-w-7xl px-5 py-14 md:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="sf-display text-xl font-bold">{store.name}</p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-sf-muted">
              {store.tagline}. {store.shippingNote}
            </p>
            <div className="mt-5 flex gap-3">
              {s.instagram && (
                <a
                  href={`https://instagram.com/${s.instagram}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${store.name} on Instagram`}
                  className="flex size-9 items-center justify-center rounded-full border border-sf-line transition-colors hover:border-sf-ink"
                >
                  <InstagramIcon className="size-4" />
                </a>
              )}
              {s.tiktok && (
                <a
                  href={`https://tiktok.com/@${s.tiktok}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${store.name} on TikTok`}
                  className="flex size-9 items-center justify-center rounded-full border border-sf-line transition-colors hover:border-sf-ink"
                >
                  <TikTokIcon className="size-4" />
                </a>
              )}
              {s.twitter && (
                <a
                  href={`https://x.com/${s.twitter}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${store.name} on X`}
                  className="flex size-9 items-center justify-center rounded-full border border-sf-line transition-colors hover:border-sf-ink"
                >
                  <XIcon className="size-4" />
                </a>
              )}
            </div>
          </div>

          <nav aria-label="Store pages">
            <h3 className="text-sm font-semibold">Browse</h3>
            <ul className="mt-3.5 space-y-2.5 text-sm text-sf-muted">
              <li>
                <Link href={base} className="transition-colors hover:text-sf-ink">
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href={`${base}/shop`}
                  className="transition-colors hover:text-sf-ink"
                >
                  Shop everything
                </Link>
              </li>
              {store.categories.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`${base}/shop?collection=${c.slug}`}
                    className="transition-colors hover:text-sf-ink"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href={`${base}/contact`}
                  className="transition-colors hover:text-sf-ink"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h3 className="text-sm font-semibold">Get first dibs</h3>
            <p className="mt-3.5 text-sm text-sf-muted">
              New drops and restocks, straight to your inbox. No noise.
            </p>
            <div className="mt-4">
              <NewsletterForm compact />
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-sf-line pt-6 text-xs text-sf-muted sm:flex-row sm:items-center sm:justify-between">
          <p>{store.theme.footerText}</p>
          <p>
            Built on{" "}
            <Link href="/" className="underline-offset-4 hover:underline">
              Awning
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
