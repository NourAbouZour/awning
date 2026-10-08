import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, Mail, Package, Truck } from "lucide-react";
import { getStoreBySlug } from "@/server/stores";
import { getOrderByNumber } from "@/server/orders";

export const metadata: Metadata = { title: "Order confirmed" };

export default async function OrderConfirmedPage({
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

  const order = orderParam
    ? await getOrderByNumber(store.id, orderParam)
    : null;
  const orderNumber = order?.number ?? orderParam ?? "";

  const steps = [
    {
      icon: Mail,
      title: "Order recorded",
      body: "Your order details are saved — keep your order number handy.",
    },
    {
      icon: Package,
      title: "Packed with care",
      body: `The ${store.name} team packs orders every weekday morning.`,
    },
    {
      icon: Truck,
      title: "On its way",
      body: "You'll get tracking the moment it ships — usually within 24 hours.",
    },
  ];

  return (
    <div className="mx-auto max-w-2xl px-5 py-16 text-center md:py-24">
      <span className="mx-auto flex size-16 animate-fade-up items-center justify-center rounded-full bg-sf-brand">
        <Check className="size-8 text-sf-on-brand" strokeWidth={3} />
      </span>
      <h1 className="sf-display mt-7 animate-fade-up text-4xl [animation-delay:80ms] md:text-5xl">
        Thank you — it&apos;s yours.
      </h1>
      <p className="mx-auto mt-4 max-w-md animate-fade-up text-lg leading-relaxed text-sf-muted [animation-delay:160ms]">
        {orderNumber ? (
          <>
            Order{" "}
            <span className="font-semibold text-sf-ink">{orderNumber}</span> is
            confirmed and paid. Here&apos;s what happens next:
          </>
        ) : (
          <>Your order is confirmed and paid. Here&apos;s what happens next:</>
        )}
      </p>

      <ul className="mt-10 space-y-4 text-left">
        {steps.map((s, i) => (
          <li
            key={s.title}
            className="flex animate-fade-up items-start gap-4 rounded-2xl border border-sf-line p-5"
            style={{ animationDelay: `${240 + i * 90}ms` }}
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sf-wash">
              <s.icon className="size-4.5" />
            </span>
            <div>
              <p className="text-sm font-semibold">{s.title}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-sf-muted">
                {s.body}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <Link
        href={`/s/${store.slug}/shop`}
        className="mt-10 inline-flex items-center gap-2.5 rounded-full bg-sf-brand px-8 py-4 text-sm font-semibold text-sf-on-brand transition-all hover:bg-sf-brand-hover hover:gap-3.5"
      >
        Keep shopping
        <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}
