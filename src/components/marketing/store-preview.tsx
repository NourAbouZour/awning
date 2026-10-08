import Image from "next/image";
import { themeStyle } from "@/lib/store-theme";
import { formatMoney } from "@/lib/utils";
import type { Store } from "@/lib/types";
import { ShoppingBag } from "lucide-react";

/**
 * A miniature, non-interactive render of a store's homepage — the same
 * theme variables the real storefront uses, scaled down. Used in the
 * marketing hero and the onboarding live preview.
 */
export function StorePreview({ store }: { store: Store }) {
  const t = store.theme;
  const products = store.products.filter((p) => p.status === "active").slice(0, 3);

  return (
    <div className="storefront text-sf-ink" style={themeStyle(t)}>
      {/* announcement */}
      <div className="bg-sf-brand px-3 py-1.5 text-center text-[10px] font-medium text-sf-on-brand">
        {t.announcement}
      </div>
      {/* header */}
      <div className="flex items-center justify-between border-b border-sf-line bg-sf-bg px-4 py-2.5">
        {store.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={store.logoUrl}
            alt={store.name}
            className="h-5 w-auto max-w-24 object-contain"
          />
        ) : (
          <span className="sf-display text-sm font-bold tracking-tight">
            {store.logoText}
          </span>
        )}
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
      <div className="relative aspect-[16/8] overflow-hidden">
        <Image
          src={t.heroImage}
          alt=""
          fill
          sizes="600px"
          className="object-cover"
          unoptimized={t.heroImage.startsWith("blob:")}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <p className="sf-display max-w-[16rem] text-base leading-tight text-white md:text-lg">
            {t.heroHeadline}
          </p>
          <span className="mt-2 inline-block rounded-full bg-sf-brand px-3 py-1 text-[9px] font-semibold text-sf-on-brand">
            {t.heroCta}
          </span>
        </div>
      </div>
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
    </div>
  );
}
