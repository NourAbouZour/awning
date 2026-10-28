import Image from "next/image";
import { themeStyle } from "@/lib/store-theme";
import { formatMoney } from "@/lib/utils";
import type { Store } from "@/lib/types";
import { ShoppingBag } from "lucide-react";

/**
 * A miniature, non-interactive render of a store's homepage — the same theme
 * variables the real storefront uses, scaled down. Renders the full page
 * (hero, collections, products, story, newsletter, footer) so the design
 * editor and onboarding previews show everything, not just the top.
 */
export function StorePreview({ store }: { store: Store }) {
  const t = store.theme;
  const products = store.products
    .filter((p) => p.status === "active")
    .slice(0, 3);
  const collections = store.categories.filter((c) => c.image).slice(0, 3);
  const enabled = (id: string) =>
    !t.sections?.length || t.sections.some((s) => s.id === id && s.enabled);

  return (
    <div className="storefront text-sf-ink" style={themeStyle(t)}>
      {/* announcement */}
      <div className="bg-sf-brand px-3 py-1.5 text-center text-[10px] font-medium text-sf-on-brand">
        {t.announcement}
      </div>
      {/* header */}
      <div className="flex items-center justify-between border-b border-sf-line bg-sf-bg px-4 py-2.5">
        <span className="flex items-center gap-1.5">
          {store.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={store.logoUrl}
              alt=""
              className="h-5 w-auto max-w-16 object-contain"
            />
          )}
          <span className="sf-display text-sm font-bold tracking-tight">
            {store.logoText || store.name}
          </span>
        </span>
        <span className="flex items-center gap-3 text-[10px] text-sf-muted">
          <span>Shop</span>
          <span>Contact</span>
          <span className="relative">
            <ShoppingBag className="size-3.5" />
            <span className="absolute -right-1.5 -top-1.5 flex size-3 items-center justify-center rounded-full bg-sf-brand text-[7px] font-bold text-sf-on-brand">
              2
            </span>
          </span>
        </span>
      </div>

      {/* hero */}
      {enabled("hero") && (
        <div className="relative aspect-[16/9] overflow-hidden bg-neutral-900">
          {t.heroImage && (
            <Image
              src={t.heroImage}
              alt=""
              fill
              sizes="600px"
              className="object-cover"
              unoptimized={t.heroImage.startsWith("blob:")}
            />
          )}
          <div
            className={
              t.heroImage
                ? "absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent"
                : "absolute inset-0 bg-gradient-to-t from-black/70 via-black/45 to-black/30"
            }
          />
          <div className="absolute inset-x-0 bottom-0 p-4">
            <p className="sf-display max-w-[16rem] text-base leading-tight text-white md:text-lg">
              {t.heroHeadline}
            </p>
            {t.heroSub && (
              <p className="mt-1 max-w-[18rem] text-[9px] leading-snug text-white/85">
                {t.heroSub}
              </p>
            )}
            <span className="mt-2 inline-block rounded-full bg-sf-brand px-3 py-1 text-[9px] font-semibold text-sf-on-brand">
              {t.heroCta}
            </span>
          </div>
        </div>
      )}

      {/* collections */}
      {enabled("collections") && collections.length > 0 && (
        <div className="bg-sf-bg px-3.5 pt-3.5">
          <p className="sf-display text-xs font-semibold">
            {t.collectionsTitle || "Shop by collection"}
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {collections.map((c) => (
              <div
                key={c.id}
                className="relative aspect-[4/3] overflow-hidden rounded-md bg-sf-wash"
              >
                <Image
                  src={c.image}
                  alt={c.name}
                  fill
                  sizes="200px"
                  className="object-cover"
                  unoptimized={c.image.startsWith("blob:")}
                />
                <span className="absolute bottom-1 left-1.5 text-[8px] font-semibold text-white drop-shadow">
                  {c.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* products */}
      <div className="grid grid-cols-3 gap-2.5 bg-sf-bg p-3.5">
        {products.map((p) => (
          <div key={p.id}>
            <div className="relative aspect-square overflow-hidden rounded-md bg-sf-wash">
              <Image
                src={p.images[0]}
                alt={p.title}
                fill
                sizes="200px"
                className="object-cover"
                unoptimized={p.images[0].startsWith("blob:")}
              />
            </div>
            <p className="mt-1.5 truncate text-[9px] font-medium">{p.title}</p>
            <p className="text-[9px] text-sf-muted">
              {formatMoney(p.price, store.currency)}
            </p>
          </div>
        ))}
      </div>

      {/* story */}
      {enabled("story") && (t.storyTitle || t.storyImage) && (
        <div className="grid grid-cols-2 items-center gap-3 bg-sf-wash p-3.5">
          <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-sf-bg">
            {t.storyImage && (
              <Image
                src={t.storyImage}
                alt=""
                fill
                sizes="200px"
                className="object-cover"
                unoptimized={t.storyImage.startsWith("blob:")}
              />
            )}
          </div>
          <div>
            <p className="sf-display text-xs font-semibold leading-tight">
              {t.storyTitle}
            </p>
            <p className="mt-1 line-clamp-3 text-[8px] leading-snug text-sf-muted">
              {t.storyBody}
            </p>
          </div>
        </div>
      )}

      {/* newsletter */}
      {enabled("newsletter") && (
        <div className="bg-sf-bg p-3.5">
          <div className="rounded-lg bg-sf-wash px-3 py-4 text-center">
            <p className="sf-display text-xs font-semibold">
              {t.newsletterTitle || "Be first to every drop"}
            </p>
            <p className="mx-auto mt-1 max-w-[14rem] text-[8px] leading-snug text-sf-muted">
              {t.newsletterBody}
            </p>
            <span className="mt-2 inline-block rounded-full bg-sf-brand px-3 py-1 text-[8px] font-semibold text-sf-on-brand">
              Subscribe
            </span>
          </div>
        </div>
      )}

      {/* footer */}
      <div className="border-t border-sf-line bg-sf-bg px-3.5 py-2.5 text-[8px] text-sf-muted">
        {t.footerText || store.name}
      </div>
    </div>
  );
}
