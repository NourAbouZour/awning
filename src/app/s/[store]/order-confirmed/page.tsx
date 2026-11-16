import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, PackageSearch, Phone, Truck } from "lucide-react";
import { getStoreBySlug } from "@/server/stores";
import { getOrderByNumber } from "@/server/orders";
import { formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Order placed" };

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
  const orderNumber = order?.number ?? "";
  const payByWhish = order?.paymentMethod === "whish";
  const digits = orderNumber.replace(/\D/g, "");

  const steps = [
    {
      icon: Phone,
      title: "The store confirms your order",
      body: payByWhish
        ? `${store.name} will contact you with their Whish details. Your order is prepared once the payment arrives.`
        : `${store.name} will contact you to confirm. You pay in cash when your order arrives.`,
    },
    {
      icon: Truck,
      title: "Prepared and delivered",
      body: "Your order is packed and sent to the address you gave.",
    },
    {
      icon: PackageSearch,
      title: "Follow your order",
      body: digits
        ? `Use your order number ${orderNumber} on the Track order page any time.`
        : "Use your order number on the Track order page any time.",
    },
  ];

  return (
    <div className="mx-auto max-w-2xl px-5 py-16 text-center md:py-24">
      <span className="mx-auto flex size-16 animate-fade-up items-center justify-center rounded-full bg-sf-brand">
        <Check className="size-8 text-sf-on-brand" strokeWidth={3} />
      </span>
      <h1 className="sf-display mt-7 animate-fade-up text-4xl [animation-delay:80ms] md:text-5xl">
        Thank you, your order is in.
      </h1>
      <p className="mx-auto mt-4 max-w-md animate-fade-up text-lg leading-relaxed text-sf-muted [animation-delay:160ms]">
        {orderNumber ? (
          <>
            Order <span className="font-semibold text-sf-ink">{orderNumber}</span>{" "}
            has been placed
            {order ? <> ({formatMoney(order.total, store.currency)})</> : null}.
            Keep this number to follow your order.
          </>
        ) : (
          <>Your order has been placed.</>
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

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        {digits && (
          <Link
            href={`/s/${store.slug}/track?order=${digits}`}
            className="inline-flex items-center gap-2.5 rounded-full border border-sf-line px-7 py-4 text-sm font-semibold transition-colors hover:border-sf-ink"
          >
            <PackageSearch className="size-4" />
            Track this order
          </Link>
        )}
        <Link
          href={`/s/${store.slug}/shop`}
          className="inline-flex items-center gap-2.5 rounded-full bg-sf-brand px-8 py-4 text-sm font-semibold text-sf-on-brand transition-all hover:bg-sf-brand-hover hover:gap-3.5"
        >
          Keep shopping
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
