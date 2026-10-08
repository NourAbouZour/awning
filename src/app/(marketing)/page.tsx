import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BadgeCheck,
  CreditCard,
  Inbox,
  Package,
  Palette,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BrowserFrame } from "@/components/marketing/browser-frame";
import { StorePreview } from "@/components/marketing/store-preview";
import { listStores } from "@/server/stores";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/motion";
import type { Store } from "@/lib/types";

export const metadata: Metadata = {
  title: "Awning — Put up your shop",
  description:
    "Awning gives anyone a beautiful online store in minutes. Add products, pick your look, and start selling — no code, no designer, no headache.",
};

// Reads live stores from the database for the example previews.
export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const stores = await listStores();
  return (
    <>
      <Hero stores={stores} />
      <ExampleStores stores={stores} />
      <Features />
      <Reveal>
        <Steps />
      </Reveal>
      <Reveal>
        <Testimonials />
      </Reveal>
      <PricingStrip />
      <Reveal>
        <Faq />
      </Reveal>
      <FinalCta />
    </>
  );
}

/* ------------------------------------------------------------------ */

function Hero({ stores }: { stores: Store[] }) {
  const primary = stores[0];
  const secondary = stores[1];
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-14 md:grid-cols-[1.05fr_1fr] md:px-8 md:pb-28 md:pt-20">
        <div className="animate-fade-up">
          <p className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-paper px-3.5 py-1.5 text-[13px] text-ink-body">
            <span className="size-1.5 rounded-full bg-ok" aria-hidden />
            2,400 shops opened this month
          </p>
          <h1 className="mt-6 font-display text-[44px] font-bold leading-[1.02] tracking-tight text-ink sm:text-6xl lg:text-7xl">
            Put up your awning.
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-ink-body">
            The simplest way to open a real online store. Add your products,
            pick your look, and you&apos;re selling — usually before your
            coffee goes cold.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button size="xl" asChild>
              <Link href="/signup">
                Start your store free
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            {primary && (
              <Button size="xl" variant="ghost" asChild>
                <Link href={`/s/${primary.slug}`}>Browse a live store</Link>
              </Button>
            )}
          </div>
          <p className="mt-4 text-sm text-ink-soft">
            No card needed. Your first month is free.
          </p>
        </div>

        {/* Two storefronts, same template */}
        <div className="relative animate-fade-up [animation-delay:150ms]">
          {secondary && (
            <div className="absolute -right-6 -top-6 hidden w-[76%] rotate-2 opacity-90 lg:block">
              <BrowserFrame url={`${secondary.slug}.awning.shop`}>
                <StorePreview store={secondary} />
              </BrowserFrame>
            </div>
          )}
          {primary && (
            <div className="relative lg:mt-24 lg:w-[88%]">
              <BrowserFrame url={`${primary.slug}.awning.shop`}>
                <StorePreview store={primary} />
              </BrowserFrame>
            </div>
          )}
        </div>
      </div>
      {/* awning hem under the hero */}
      <div aria-hidden>
        <div className="awning-stripes h-3.5" />
        <div className="scallop awning-stripes" />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function ExampleStores({ stores }: { stores: Store[] }) {
  const items = stores.slice(0, 2).map((store) => ({ store, blurb: store.tagline }));
  if (items.length === 0) return null;
  return (
    <section id="stores" className="scroll-mt-20 bg-paper py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-bold tracking-tight text-ink md:text-5xl">
            One template. Your brand all over it.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ink-body">
            Every Awning store runs the same carefully-built storefront. Your
            logo, colors, type, and photos make it unmistakably yours. These
            are live — click through and poke around.
          </p>
        </div>
        <Stagger className="mt-12 grid gap-8 md:grid-cols-2">
          {items.map(({ store, blurb }) => (
            <StaggerItem key={store.id}>
            <Link
              href={`/s/${store.slug}`}
              className="group block"
            >
              <div className="overflow-hidden rounded-2xl border border-line transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_24px_48px_-20px_rgb(0_0_0/0.25)]">
                <div className="relative aspect-[16/9] overflow-hidden bg-canvas">
                  {store.theme.heroImage && (
                    <Image
                      src={store.theme.heroImage}
                      alt={`${store.name} storefront`}
                      fill
                      sizes="(min-width: 768px) 560px, 100vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                  <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
                    <div>
                      <p className="font-display text-2xl font-bold text-white">
                        {store.name}
                      </p>
                      <p className="text-sm text-white/80">{store.tagline}</p>
                    </div>
                    <span
                      className="rounded-full px-3.5 py-1.5 text-xs font-semibold"
                      style={{
                        background: store.theme.brandColor,
                        color: "#fff",
                      }}
                    >
                      Visit store
                    </span>
                  </div>
                </div>
              </div>
              <p className="mt-3.5 text-sm text-ink-soft">{blurb}</p>
            </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

const features = [
  {
    icon: Palette,
    title: "Your brand, everywhere, automatically",
    body: "Pick a color and a font pairing once. Buttons, badges, and headings follow it across your whole store — with text contrast handled for you.",
    vignette: <BrandVignette />,
  },
  {
    icon: Package,
    title: "Products without the spreadsheet feeling",
    body: "Photos you can drag to reorder, variants with their own stock and price, and bulk actions when the catalog grows.",
    vignette: <ProductVignette />,
  },
  {
    icon: CreditCard,
    title: "Checkout that pays you directly",
    body: "Stripe-powered checkout wired to your own account. Money lands with you, not in someone's escrow.",
    vignette: <CheckoutVignette />,
  },
  {
    icon: Zap,
    title: "Fast enough to feel expensive",
    body: "Optimized images, instant search, skeleton loading. Your store feels like it cost ten grand, not ten minutes.",
    vignette: <SpeedVignette />,
  },
  {
    icon: Inbox,
    title: "Orders, customers, and messages in one inbox",
    body: "See who bought, what shipped, and who's asking about sizing — without opening five tabs.",
    vignette: <InboxVignette />,
  },
  {
    icon: BadgeCheck,
    title: "A dashboard that respects your time",
    body: "Sales today, orders to fulfill, what to do next. The important things first, nothing else shouting.",
    vignette: <ChartVignette />,
  },
];

function Features() {
  return (
    <section id="features" className="scroll-mt-20 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-bold tracking-tight text-ink md:text-5xl">
            Everything a real shop needs. Nothing it doesn&apos;t.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ink-body">
            Awning is deliberately small: the tools that sell products, kept
            sharp, and nothing to configure that doesn&apos;t matter.
          </p>
        </div>
        <Stagger className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <StaggerItem
              key={f.title}
              className="flex flex-col overflow-hidden rounded-2xl border border-line bg-paper"
            >
              <div className="flex h-36 items-center justify-center border-b border-line bg-canvas px-6">
                {f.vignette}
              </div>
              <div className="flex flex-1 flex-col p-6">
                <h3 className="font-display text-[17px] font-semibold leading-snug text-ink">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {f.body}
                </p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/* little hand-drawn UI vignettes — real pixels, not stock icons */

function BrandVignette() {
  return (
    <div className="flex items-center gap-4" aria-hidden>
      <div className="flex gap-2">
        {["#f54a00", "#4d5f4a", "#1d4fd7", "#9a1750"].map((c, i) => (
          <span
            key={c}
            className="size-7 rounded-full border-2 border-paper shadow-sm"
            style={{ background: c, marginLeft: i ? -14 : 0 }}
          />
        ))}
      </div>
      <div className="flex items-baseline gap-2.5">
        <span className="font-display text-3xl font-bold text-ink">Aa</span>
        <span style={{ fontFamily: "var(--font-fraunces)" }} className="text-3xl text-ink">
          Aa
        </span>
        <span
          style={{ fontFamily: "var(--font-archivo)", fontWeight: 800 }}
          className="text-3xl text-ink"
        >
          Aa
        </span>
      </div>
    </div>
  );
}

function ProductVignette() {
  return (
    <div className="flex w-full max-w-[240px] flex-col gap-2" aria-hidden>
      {[
        { w: "w-24", stock: "12 in stock", ok: true },
        { w: "w-32", stock: "3 left", ok: false },
      ].map((r, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg border border-line bg-paper px-3 py-2"
        >
          <span className="size-8 rounded-md bg-green-wash" />
          <div className="flex-1">
            <span className={`block h-2 ${r.w} rounded bg-ink/15`} />
            <span className="mt-1.5 block h-2 w-14 rounded bg-ink/8" />
          </div>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
              r.ok ? "bg-ok-wash text-ok" : "bg-warn-wash text-warn"
            }`}
          >
            {r.stock}
          </span>
        </div>
      ))}
    </div>
  );
}

function CheckoutVignette() {
  return (
    <div className="w-full max-w-[220px] rounded-xl border border-line bg-paper p-3.5 shadow-sm" aria-hidden>
      <div className="flex justify-between text-xs text-ink-soft">
        <span>Court Classic — US 9</span>
        <span className="font-medium text-ink">$118</span>
      </div>
      <div className="mt-2 flex justify-between text-xs text-ink-soft">
        <span>Shipping</span>
        <span className="font-medium text-ink">Free</span>
      </div>
      <div className="mt-3 rounded-lg bg-green py-2 text-center text-xs font-semibold text-white">
        Pay $118.00
      </div>
    </div>
  );
}

function SpeedVignette() {
  return (
    <div className="flex items-end gap-1.5" aria-hidden>
      {[34, 48, 28, 56, 40, 64, 52, 72, 60, 84].map((h, i) => (
        <span
          key={i}
          className="w-3 rounded-t-sm bg-green/70"
          style={{ height: h * 0.9, opacity: 0.35 + i * 0.065 }}
        />
      ))}
    </div>
  );
}

function InboxVignette() {
  return (
    <div className="flex w-full max-w-[240px] flex-col gap-2" aria-hidden>
      {[
        { n: "Maya O.", t: "Order #1040 · Fulfilled", dot: false },
        { n: "Jordan P.", t: "“Do they run big?”", dot: true },
      ].map((m) => (
        <div
          key={m.n}
          className="flex items-center gap-3 rounded-lg border border-line bg-paper px-3 py-2"
        >
          <span className="flex size-7 items-center justify-center rounded-full bg-green-wash text-[10px] font-semibold text-green">
            {m.n[0]}
          </span>
          <div className="flex-1 text-left">
            <p className="text-[11px] font-medium text-ink">{m.n}</p>
            <p className="text-[10px] text-ink-soft">{m.t}</p>
          </div>
          {m.dot && <span className="size-2 rounded-full bg-green" />}
        </div>
      ))}
    </div>
  );
}

function ChartVignette() {
  const points = "0,46 20,38 40,42 60,30 80,34 100,22 120,26 140,14 160,18 180,6";
  return (
    <svg viewBox="0 0 180 50" className="w-full max-w-[220px]" aria-hidden>
      <polyline
        points={points}
        fill="none"
        stroke="var(--green)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polygon
        points={`${points} 180,50 0,50`}
        fill="var(--green)"
        opacity="0.08"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */

const steps = [
  {
    title: "Name your store",
    body: "Type a name, get your own address like yourshop.awning.shop — checked live.",
  },
  {
    title: "Make it yours",
    body: "Logo, brand color, and one of five font pairings. Watch the preview change as you click.",
  },
  {
    title: "Add a product",
    body: "One photo, a price, a sentence. You can add the other forty later.",
  },
  {
    title: "Open for business",
    body: "Your store is live on the internet. Share the link, take orders, get paid.",
  },
];

function Steps() {
  return (
    <section className="border-y border-line bg-paper py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="md:flex md:items-end md:justify-between">
          <h2 className="max-w-xl font-display text-3xl font-bold tracking-tight text-ink md:text-5xl">
            From nothing to open in about five minutes.
          </h2>
          <p className="mt-4 max-w-xs text-ink-soft md:mt-0 md:text-right">
            Timed with real shop owners. The record is 3:41.
          </p>
        </div>
        <ol className="mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.title} className="relative">
              <div className="flex items-center gap-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-green font-display text-sm font-bold text-white">
                  {i + 1}
                </span>
                {i < steps.length - 1 && (
                  <span
                    className="hidden h-px flex-1 bg-line-strong lg:block"
                    aria-hidden
                  />
                )}
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-ink">
                {s.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                {s.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

const testimonials = [
  {
    quote:
      "I'd been quoted $8,000 for a website. I built my store on Awning during my lunch break and sold two prints before dinner.",
    name: "Renata Silva",
    store: "Silva Prints, Miami",
  },
  {
    quote:
      "The part that got me: I picked a color and the whole store just… matched. Buttons, badges, everything. I never touched a setting twice.",
    name: "Tom Osei",
    store: "Osei Coffee Goods, Chicago",
  },
  {
    quote:
      "We moved from a big platform and our checkout conversion went up, not down. Customers keep asking who designed the site.",
    name: "Hana Ito",
    store: "Ito Ceramics, Portland",
  },
];

function Testimonials() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <h2 className="max-w-2xl font-display text-3xl font-bold tracking-tight text-ink md:text-5xl">
          Shopkeepers first. Software second.
        </h2>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="flex flex-col justify-between rounded-2xl border border-line bg-paper p-7"
            >
              <blockquote className="text-[15px] leading-relaxed text-ink-body">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-6 border-t border-line pt-4">
                <p className="text-sm font-semibold text-ink">{t.name}</p>
                <p className="text-sm text-ink-soft">{t.store}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function PricingStrip() {
  return (
    <section className="border-y border-line bg-green-wash/60 py-14">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 md:flex-row md:items-center md:px-8">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
            Free to build. One simple monthly plan when you&apos;re ready.
          </h2>
          <p className="mt-2 text-ink-body">
            Every plan includes the full storefront, checkout, and dashboard.
            No per-sale fees — just a flat monthly subscription, and your first
            month is free.
          </p>
        </div>
        <Button size="lg" variant="dark" asChild>
          <Link href="/pricing">
            See pricing
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

const faqs = [
  {
    q: "Do I need to know anything about websites?",
    a: "No. If you can fill in a form and pick a favorite color, you can open a store. The wizard walks you through five short steps, and you can change anything later from the dashboard.",
  },
  {
    q: "How do I get paid?",
    a: "You connect your own Stripe account during setup (it takes a couple of minutes). Customers pay by card at checkout and the money goes directly to you — Awning never holds your funds.",
  },
  {
    q: "Can I use my own domain name?",
    a: "Every store gets a free address like yourshop.awning.shop the moment it goes live. Connecting a custom domain you already own is supported on paid plans.",
  },
  {
    q: "What does it cost to start?",
    a: "Nothing. Building your store, adding products, and publishing it are free, and your first month is free too. After that it's one simple monthly subscription — no per-sale fees. See the pricing page for the exact numbers.",
  },
  {
    q: "Can I move my store somewhere else later?",
    a: "Yes. Your products, customers, and orders are yours — export them as CSV any time, no lock-in, no exit fee.",
  },
];

function Faq() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 md:grid-cols-[1fr_1.4fr] md:px-8">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">
            Questions, answered.
          </h2>
          <p className="mt-4 text-ink-soft">
            Something else on your mind?{" "}
            <a
              href="mailto:hello@awning.shop"
              className="font-medium text-green underline-offset-4 hover:underline"
            >
              Write to us
            </a>{" "}
            — a human replies.
          </p>
        </div>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((f) => (
            <AccordionItem key={f.q} value={f.q} className="border-line">
              <AccordionTrigger className="text-[15px] text-ink">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-ink-soft">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function FinalCta() {
  return (
    <section className="relative bg-green">
      <div aria-hidden className="absolute inset-x-0 top-0">
        <div className="scallop bg-canvas" />
      </div>
      <div className="mx-auto max-w-6xl px-5 py-24 text-center md:px-8 md:py-32">
        <h2 className="mx-auto max-w-3xl font-display text-4xl font-bold leading-[1.05] tracking-tight text-white md:text-6xl">
          The internet has room for one more great shop.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-white/80">
          Yours. Open it tonight — it&apos;s free to start and takes about five
          minutes.
        </p>
        <div className="mt-9 flex justify-center">
          <Button
            size="xl"
            className="bg-white text-green hover:bg-white/90"
            asChild
          >
            <Link href="/signup">
              Start your store free
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
