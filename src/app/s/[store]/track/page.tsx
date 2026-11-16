import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStoreBySlug } from "@/server/stores";
import { trackOrder } from "@/app/s/[store]/actions";
import { TrackClient } from "./track-client";

export const metadata: Metadata = { title: "Track my order" };

export default async function TrackOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ store: string }>;
  searchParams: Promise<{ order?: string }>;
}) {
  const { store: slug } = await params;
  const { order: orderParam } = await searchParams;
  const store = await getStoreBySlug(slug);
  if (!store) notFound();

  // Arriving from the confirmation page: look the order up straight away.
  const initial = orderParam ? await trackOrder(slug, orderParam) : null;

  return (
    <div className="mx-auto max-w-xl px-5 py-14 md:py-20">
      <h1 className="sf-display text-4xl md:text-5xl">Track my order</h1>
      <p className="mt-3 text-sf-muted">
        Type the order number from your confirmation to see where your order
        is.
      </p>
      <TrackClient
        storeSlug={store.slug}
        storeName={store.name}
        currency={store.currency}
        initialNumber={orderParam?.replace(/\D/g, "") ?? ""}
        initial={initial}
      />
    </div>
  );
}
