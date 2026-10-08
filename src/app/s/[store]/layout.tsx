import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CartProvider } from "@/components/storefront/cart-context";
import { CartDrawer } from "@/components/storefront/cart-drawer";
import { StoreFooter } from "@/components/storefront/store-footer";
import { StoreHeader } from "@/components/storefront/store-header";
import { OwnerBar } from "@/components/storefront/owner-bar";
import { getStoreBySlug, getStoreOwner } from "@/server/stores";
import { getCurrentUser } from "@/lib/auth";
import { themeStyle } from "@/lib/store-theme";

// Storefronts read live merchant data, so render them dynamically.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ store: string }>;
}): Promise<Metadata> {
  const { store: slug } = await params;
  const store = await getStoreBySlug(slug);
  if (!store) return {};
  return {
    title: {
      default: `${store.name} — ${store.tagline}`,
      template: `%s · ${store.name}`,
    },
    description: store.theme.heroSub,
    openGraph: {
      title: `${store.name} — ${store.tagline}`,
      description: store.theme.heroSub,
      images: store.theme.heroImage ? [{ url: store.theme.heroImage }] : [],
    },
  };
}

export default async function StorefrontLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ store: string }>;
}) {
  const { store: slug } = await params;
  const store = await getStoreBySlug(slug);
  if (!store) notFound();

  const [user, owner] = await Promise.all([
    getCurrentUser(),
    getStoreOwner(slug),
  ]);
  const isOwner = !!user && user.id === owner?.userId;

  // Suspended account → storefront is offline (owner can still see a notice).
  if (owner && !owner.active && !isOwner) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-6 text-center">
        <h1 className="font-display text-3xl font-bold text-ink">
          This store is temporarily unavailable
        </h1>
        <p className="mt-3 max-w-md text-ink-soft">
          {store.name} isn&apos;t taking orders right now. Please check back
          soon.
        </p>
      </div>
    );
  }

  return (
    <div
      className="storefront flex min-h-dvh flex-col"
      style={themeStyle(store.theme)}
    >
      <CartProvider store={store}>
        {isOwner && <OwnerBar />}
        <p className="bg-sf-brand px-4 py-2 text-center text-[13px] font-medium text-sf-on-brand">
          {store.theme.announcement}
        </p>
        <StoreHeader />
        <main className="flex-1">{children}</main>
        <StoreFooter store={store} />
        <CartDrawer />
      </CartProvider>
    </div>
  );
}
