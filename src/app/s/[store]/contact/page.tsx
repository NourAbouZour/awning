import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { ContactForm } from "@/components/storefront/contact-form";
import { getStoreBySlug } from "@/server/stores";
import { mapsLinkFor } from "@/lib/lebanon";
import { parseHours, formatDayRange } from "@/lib/hours";

export const metadata: Metadata = { title: "Contact" };

export default async function ContactPage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store: slug } = await params;
  const store = await getStoreBySlug(slug);
  if (!store) notFound();

  const addressLine = [store.address, store.district, store.city]
    .filter((p) => p && p.trim())
    .join(", ");
  const mapsLink = mapsLinkFor({
    mapsUrl: store.mapsUrl,
    address: store.address,
    district: store.district,
    city: store.city,
  });
  const hours = parseHours(store.hours);

  const info = [
    store.contactEmail && {
      icon: Mail,
      label: "Email",
      value: store.contactEmail,
      href: `mailto:${store.contactEmail}`,
    },
    store.phone && {
      icon: Phone,
      label: "Phone",
      value: store.phone,
      href: `tel:${store.phone.replace(/[^+\d]/g, "")}`,
    },
    addressLine && {
      icon: MapPin,
      label: "Shop",
      value: mapsLink ? `${addressLine}, View on Google Maps` : addressLine,
      href: mapsLink ?? undefined,
    },
    // Only use a plain "Hours" row when hours aren't structured.
    !hours && store.hours && {
      icon: Clock,
      label: "Hours",
      value: store.hours,
    },
  ].filter(Boolean) as {
    icon: typeof Mail;
    label: string;
    value: string;
    href?: string;
  }[];

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 md:px-8 md:py-16">
      <div className="max-w-xl">
        <h1 className="sf-display text-4xl md:text-5xl">Talk to us</h1>
        <p className="mt-4 text-lg leading-relaxed text-sf-muted">
          Questions about an order, sizing, or anything else, write and a real
          person from {store.name} will get back to you.
        </p>
      </div>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-20">
        <ContactForm storeName={store.name} storeSlug={store.slug} />

        <aside>
          <ul className="space-y-6">
            {info.map((it) => (
              <li key={it.label} className="flex items-start gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-sf-wash">
                  <it.icon className="size-4.5" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{it.label}</p>
                  {it.href ? (
                    <a
                      href={it.href}
                      className="mt-0.5 block text-sm text-sf-muted underline-offset-4 transition-colors hover:text-sf-ink hover:underline"
                    >
                      {it.value}
                    </a>
                  ) : (
                    <p className="mt-0.5 text-sm leading-relaxed text-sf-muted">
                      {it.value}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {hours && (
            <div className="mt-8">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Clock className="size-4" />
                Opening hours
              </p>
              <ul className="mt-3 space-y-1.5">
                {hours.map((d) => (
                  <li
                    key={d.day}
                    className="flex items-center justify-between gap-6 text-sm"
                  >
                    <span className="font-medium">{d.day}</span>
                    <span className={d.closed ? "text-sf-muted" : ""}>
                      {formatDayRange(d)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-10 rounded-2xl bg-sf-wash p-6">
            <p className="text-sm font-semibold">Order questions?</p>
            <p className="mt-1.5 text-sm leading-relaxed text-sf-muted">
              Include your order number (it&apos;s in your confirmation email)
              and we can usually sort things out in one reply.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
