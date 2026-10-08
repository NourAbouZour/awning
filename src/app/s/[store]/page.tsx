import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowRight, Lock, RefreshCcw, Truck } from "lucide-react";
import { NewsletterForm } from "@/components/storefront/newsletter-form";
import { ProductCarousel } from "@/components/storefront/product-carousel";
import { getStoreBySlug } from "@/server/stores";
import { Reveal } from "@/components/ui/motion";
import type { HomeSectionId, Store } from "@/lib/types";

export default async function StoreHomePage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store: slug } = await params;
  const store = await getStoreBySlug(slug);
  if (!store) notFound();

  const sections = (store.theme.sections ?? []).filter((s) => s.enabled);

  const render: Record<HomeSectionId, React.ReactNode> = {
    hero: <Hero key="hero" store={store} />,
    collections: <Collections key="collections" store={store} />,
    carousel: (
      <ProductCarousel
        key="carousel"
        title="Best sellers"
        products={store.products.filter(
          (p) => p.status === "active" && p.featured
        )}
      />
    ),
    story: <Story key="story" store={store} />,
    trust: <Trust key="trust" store={store} />,
    newsletter: <Newsletter key="newsletter" store={store} />,
  };

  return (
    <>
      {sections.map((s) =>
        s.id === "hero" ? (
          render[s.id]
        ) : (
          <Reveal key={s.id}>{render[s.id]}</Reveal>
        ),
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */

function Hero({ store }: { store: Store }) {
  const t = store.theme;
  return (
    <section className="relative flex min-h-[70dvh] items-end overflow-hidden bg-sf-wash md:min-h-[82dvh]">
      {t.heroImage && (
        <Image
          src={t.heroImage}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      )}
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/5"
        aria-hidden
      />
      <div className="relative mx-auto w-full max-w-7xl px-5 pb-14 pt-32 md:px-8 md:pb-20">
        <h1 className="sf-display max-w-4xl animate-fade-up text-5xl leading-[0.98] text-white sm:text-6xl md:text-7xl lg:text-8xl">
          {t.heroHeadline}
        </h1>
        <p className="mt-5 max-w-lg animate-fade-up text-base leading-relaxed text-white/85 [animation-delay:120ms] md:text-lg">
          {t.heroSub}
        </p>
        <div className="mt-8 animate-fade-up [animation-delay:240ms]">
          <Link
            href={`/s/${store.slug}/shop`}
            className="inline-flex items-center gap-2.5 rounded-full bg-sf-brand px-8 py-4 text-sm font-semibold text-sf-on-brand transition-all hover:bg-sf-brand-hover hover:gap-3.5"
          >
            {t.heroCta}
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Collections({ store }: { store: Store }) {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
      <h2 className="sf-display text-3xl md:text-4xl">Shop by collection</h2>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {store.categories.map((c, i) => (
          <Link
            key={c.id}
            href={`/s/${store.slug}/shop?collection=${c.slug}`}
            className={`group relative block overflow-hidden rounded-2xl ${
              i === 0 ? "sm:col-span-2 lg:col-span-1" : ""
            }`}
          >
            <div className="relative aspect-[4/5] sm:aspect-[4/3] lg:aspect-[4/5]">
              <Image
                src={c.image}
                alt={c.name}
                fill
                sizes="(min-width: 1024px) 420px, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent"
                aria-hidden
              />
            </div>
            <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between">
              <span className="sf-display text-2xl text-white">{c.name}</span>
              <span className="flex size-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-all group-hover:bg-sf-brand group-hover:text-sf-on-brand">
                <ArrowRight className="size-4" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Story({ store }: { store: Store }) {
  const t = store.theme;
  return (
    <section className="bg-sf-wash">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 md:grid-cols-2 md:px-8 md:py-24 lg:gap-16">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-sf-wash">
          {t.storyImage && (
            <Image
              src={t.storyImage}
              alt=""
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          )}
        </div>
        <div>
          <h2 className="sf-display text-3xl leading-tight md:text-4xl lg:text-5xl">
            {t.storyTitle}
          </h2>
          <p className="mt-5 max-w-prose text-base leading-relaxed text-sf-muted md:text-lg">
            {t.storyBody}
          </p>
          <Link
            href={`/s/${store.slug}/contact`}
            className="mt-7 inline-flex items-center gap-2 text-sm font-semibold underline-offset-4 transition-opacity hover:opacity-70 hover:underline"
          >
            Get in touch
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Trust({ store }: { store: Store }) {
  const items = [
    {
      icon: Truck,
      title: "Free shipping",
      body: store.shippingNote.split(".")[0] + ".",
    },
    {
      icon: RefreshCcw,
      title: "Easy returns",
      body: "Changed your mind? Send it back — no forms, no fuss.",
    },
    {
      icon: Lock,
      title: "Secure checkout",
      body: "Payments handled by Stripe. We never see your card.",
    },
  ];
  return (
    <section className="border-y border-sf-line">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:grid-cols-3 md:px-8">
        {items.map((it) => (
          <div key={it.title} className="flex items-start gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-sf-wash">
              <it.icon className="size-5" />
            </span>
            <div>
              <h3 className="text-sm font-semibold">{it.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-sf-muted">
                {it.body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Newsletter({ store }: { store: Store }) {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
      <div className="rounded-3xl bg-sf-wash px-6 py-14 text-center md:py-20">
        <h2 className="sf-display mx-auto max-w-xl text-3xl leading-tight md:text-4xl">
          Be first to every drop
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sf-muted">
          Join the {store.name} list for new releases and restocks. One or two
          emails a month, never more.
        </p>
        <div className="mt-7">
          <NewsletterForm />
        </div>
      </div>
    </section>
  );
}
