"use client";

/**
 * Merchant onboarding: five short steps with a live storefront preview that
 * updates on every choice. UI-only for now — "publishing" routes into the
 * dashboard.
 */
import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ImagePlus,
  Loader2,
  PartyPopper,
  Upload,
  X,
} from "lucide-react";
import { AwningLogo } from "@/components/awning-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BrowserFrame } from "@/components/marketing/browser-frame";
import { StorePreview } from "@/components/marketing/store-preview";
import { FONT_PAIRINGS, type FontPairingId } from "@/lib/fonts";
import { createStore } from "@/app/onboarding/actions";
import { slugify, cn } from "@/lib/utils";
import type { Store } from "@/lib/types";

/* ------------------------------------------------------------------ */
/* wizard state                                                        */
/* ------------------------------------------------------------------ */

interface WizardState {
  name: string;
  slug: string;
  slugEdited: boolean;
  logoUrl?: string;
  brandColor: string;
  fontPairing: FontPairingId;
  heroImage: string;
  heroHeadline: string;
  heroSub: string;
  productTitle: string;
  productPrice: string;
  productImage: string;
}

const img = (id: string, w = 1600) =>
  `https://images.unsplash.com/${id}?q=80&w=${w}&auto=format&fit=crop`;

const HERO_OPTIONS = [
  img("photo-1441986300917-64674bd600d8"),
  img("photo-1555529669-e69e7aa0ba9a"),
  img("photo-1556228453-efd6c1ff04f6"),
  img("photo-1549298916-b41d501d3772"),
];

const PRODUCT_IMAGE_OPTIONS = [
  img("photo-1523275335684-37898b6baf30", 800),
  img("photo-1505740420928-5e560c06d30e", 800),
  img("photo-1491553895911-0055eca6402d", 800),
];

const SAMPLE_PRODUCT_IMAGES = PRODUCT_IMAGE_OPTIONS;

const COLOR_PRESETS = [
  "#114b32",
  "#f54a00",
  "#1d4fd7",
  "#9a1750",
  "#0f766e",
  "#b45309",
  "#6d28d9",
  "#111111",
];

/** Slugs already "taken" on the platform (mock). */
const TAKEN_SLUGS = new Set(["volta", "ode", "shop", "store", "awning"]);

const STEPS = [
  "Name your store",
  "Make it yours",
  "Say hello",
  "First product",
  "Go live",
];

export default function OnboardingPage() {
  const [step, setStep] = React.useState(0);
  const [state, setState] = React.useState<WizardState>({
    name: "",
    slug: "",
    slugEdited: false,
    brandColor: "#114b32",
    fontPairing: "editorial",
    heroImage: HERO_OPTIONS[0],
    heroHeadline: "Made with care. Shipped with speed.",
    heroSub: "Small-batch goods from our workshop to your door.",
    productTitle: "",
    productPrice: "",
    productImage: PRODUCT_IMAGE_OPTIONS[0],
  });

  const patch = (p: Partial<WizardState>) =>
    setState((s) => ({ ...s, ...p }));

  /* slug availability (mock, debounced via a ref-held timer) */
  const [slugStatus, setSlugStatus] = React.useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");
  const slugTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkSlug = React.useCallback((slug: string) => {
    if (slugTimer.current) clearTimeout(slugTimer.current);
    if (!slug) {
      setSlugStatus("idle");
      return;
    }
    setSlugStatus("checking");
    slugTimer.current = setTimeout(() => {
      setSlugStatus(TAKEN_SLUGS.has(slug) ? "taken" : "available");
    }, 550);
  }, []);

  /* live preview store */
  const previewStore: Store = React.useMemo(() => {
    const name = state.name.trim() || "Your Store";
    const hasProduct = state.productTitle.trim().length > 0;
    const sampleTitles = ["Signature piece", "Everyday favorite", "The classic"];
    return {
      id: "preview",
      name,
      slug: state.slug || "your-store",
      logoText: name,
      logoUrl: state.logoUrl,
      tagline: "",
      contactEmail: "",
      phone: "",
      address: "",
      hours: "",
      currency: "USD",
      shippingNote: "",
      theme: {
        brandColor: state.brandColor,
        fontPairing: state.fontPairing,
        announcement: "Free shipping over $50",
        heroImage: state.heroImage,
        heroHeadline: state.heroHeadline || "Made with care. Shipped with speed.",
        heroSub: state.heroSub,
        heroCta: "Shop now",
        storyImage: "",
        storyTitle: "",
        storyBody: "",
        footerText: "",
        sections: [],
        socials: {},
      },
      categories: [],
      products: (hasProduct
        ? [
            {
              title: state.productTitle,
              price: Number(state.productPrice) || 0,
              image: state.productImage,
            },
            { title: sampleTitles[1], price: 42, image: SAMPLE_PRODUCT_IMAGES[1] },
            { title: sampleTitles[2], price: 28, image: SAMPLE_PRODUCT_IMAGES[2] },
          ]
        : sampleTitles.map((t, i) => ({
            title: t,
            price: [64, 42, 28][i],
            image: SAMPLE_PRODUCT_IMAGES[i],
          }))
      ).map((p, i) => ({
        id: `prev_${i}`,
        slug: `prev-${i}`,
        title: p.title,
        description: "",
        details: "",
        price: p.price,
        images: [p.image],
        categoryId: "",
        inventory: 10,
        sku: "",
        status: "active" as const,
        createdAt: "2026-01-01T00:00:00Z",
      })),
    };
  }, [state]);

  const [publishing, setPublishing] = React.useState(false);
  const [createdSlug, setCreatedSlug] = React.useState<string | null>(null);
  const [publishError, setPublishError] = React.useState("");

  const canContinue =
    step === 0
      ? state.name.trim().length >= 2 && slugStatus === "available"
      : step === 2
        ? state.heroHeadline.trim().length > 0
        : true;

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  function goLive() {
    setPublishing(true);
    setPublishError("");
    React.startTransition(async () => {
      const res = await createStore({
        name: state.name,
        slug: state.slug,
        logoUrl: state.logoUrl,
        brandColor: state.brandColor,
        fontPairing: state.fontPairing,
        heroImage: state.heroImage,
        heroHeadline: state.heroHeadline,
        heroSub: state.heroSub,
        productTitle: state.productTitle,
        productPrice: state.productPrice,
        productImage: state.productImage,
      });
      setPublishing(false);
      if (res.error) {
        setPublishError(res.error);
        return;
      }
      setCreatedSlug(res.slug ?? state.slug);
      setStep(4);
    });
  }

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      {/* top bar */}
      <header className="flex h-16 items-center justify-between border-b border-line bg-canvas px-5 md:px-8">
        <Link href="/" aria-label="Awning home">
          <AwningLogo size="sm" />
        </Link>
        <ol className="hidden items-center gap-2 md:flex" aria-label="Setup progress">
          {STEPS.map((label, i) => (
            <li key={label} className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-7 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors",
                  i === step
                    ? "bg-green text-white"
                    : i < step
                      ? "bg-green-wash text-green"
                      : "bg-ink/5 text-ink-soft"
                )}
                aria-current={i === step ? "step" : undefined}
              >
                {i < step && <Check className="size-3" />}
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <span className="h-px w-3 bg-line-strong" aria-hidden />
              )}
            </li>
          ))}
        </ol>
        <span className="text-xs text-ink-soft md:hidden">
          Step {step + 1} of {STEPS.length}
        </span>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard">Skip setup</Link>
        </Button>
      </header>

      <div className="mx-auto grid w-full max-w-6xl flex-1 gap-10 px-5 py-10 md:px-8 lg:grid-cols-[1fr_1fr] lg:gap-16">
        {/* form column */}
        <div className="max-w-lg">
          {step === 0 && (
            <StepShell
              title="What's your store called?"
              sub="You can change this any time — nothing here is permanent."
            >
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="store-name">Store name</Label>
                  <Input
                    id="store-name"
                    autoFocus
                    placeholder="e.g. Hazel & Pine"
                    value={state.name}
                    onChange={(e) => {
                      const nextSlug = state.slugEdited
                        ? state.slug
                        : slugify(e.target.value);
                      patch({ name: e.target.value, slug: nextSlug });
                      if (!state.slugEdited) checkSlug(nextSlug);
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="store-slug">Your store address</Label>
                  <div className="flex items-center overflow-hidden rounded-lg border border-line-strong bg-paper focus-within:border-green focus-within:ring-2 focus-within:ring-green/15">
                    <input
                      id="store-slug"
                      className="h-10 min-w-0 flex-1 bg-transparent px-3.5 text-sm outline-none"
                      placeholder="hazel-and-pine"
                      value={state.slug}
                      onChange={(e) => {
                        const nextSlug = slugify(e.target.value);
                        patch({ slug: nextSlug, slugEdited: true });
                        checkSlug(nextSlug);
                      }}
                    />
                    <span className="border-l border-line bg-canvas px-3 text-sm text-ink-soft">
                      .awning.shop
                    </span>
                  </div>
                  <div className="min-h-5 text-xs" aria-live="polite">
                    {slugStatus === "checking" && (
                      <span className="flex items-center gap-1.5 text-ink-soft">
                        <Loader2 className="size-3 animate-spin" />
                        Checking availability…
                      </span>
                    )}
                    {slugStatus === "available" && (
                      <span className="flex items-center gap-1.5 text-ok">
                        <Check className="size-3" />
                        {state.slug}.awning.shop is yours if you want it
                      </span>
                    )}
                    {slugStatus === "taken" && (
                      <span className="flex items-center gap-1.5 text-danger">
                        <X className="size-3" />
                        Taken — try another name or tweak the address
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </StepShell>
          )}

          {step === 1 && (
            <StepShell
              title="Make it yours"
              sub="A logo if you have one, a color, and a typographic voice."
            >
              <div className="space-y-7">
                <div className="space-y-2">
                  <Label>Logo (optional)</Label>
                  {state.logoUrl ? (
                    <div className="flex items-center gap-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={state.logoUrl}
                        alt="Your logo"
                        className="h-12 w-auto max-w-40 rounded-md border border-line bg-paper object-contain p-2"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => patch({ logoUrl: undefined })}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-line-strong bg-paper px-4 py-4 text-sm text-ink-soft transition-colors hover:border-green hover:text-ink-body">
                      <Upload className="size-4" />
                      Upload a PNG or SVG — or skip and we&apos;ll use your
                      store name
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) patch({ logoUrl: URL.createObjectURL(f) });
                        }}
                      />
                    </label>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Brand color</Label>
                  <div className="flex flex-wrap items-center gap-2.5">
                    {COLOR_PRESETS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        aria-label={`Use color ${c}`}
                        aria-pressed={state.brandColor === c}
                        onClick={() => patch({ brandColor: c })}
                        className={cn(
                          "size-9 rounded-full border-2 transition-transform hover:scale-110",
                          state.brandColor === c
                            ? "border-ink"
                            : "border-transparent"
                        )}
                        style={{ background: c }}
                      />
                    ))}
                    <label className="relative flex size-9 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-dashed border-line-strong text-ink-soft hover:border-ink">
                      <ImagePlus className="size-4" />
                      <input
                        type="color"
                        aria-label="Pick a custom color"
                        className="absolute inset-0 cursor-pointer opacity-0"
                        value={state.brandColor}
                        onChange={(e) => patch({ brandColor: e.target.value })}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-ink-soft">
                    Button text flips to black or white automatically so it
                    always stays readable.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Type pairing</Label>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {FONT_PAIRINGS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        aria-pressed={state.fontPairing === p.id}
                        onClick={() => patch({ fontPairing: p.id })}
                        className={cn(
                          "rounded-xl border bg-paper p-4 text-left transition-all",
                          state.fontPairing === p.id
                            ? "border-green ring-2 ring-green/20"
                            : "border-line hover:border-line-strong"
                        )}
                      >
                        <span
                          className="block text-2xl leading-none text-ink"
                          style={{
                            fontFamily: p.display,
                            fontWeight: p.displayWeight,
                          }}
                        >
                          Aa
                        </span>
                        <span className="mt-2 block text-sm font-medium text-ink">
                          {p.label}
                        </span>
                        <span className="mt-0.5 block text-xs leading-snug text-ink-soft">
                          {p.blurb}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </StepShell>
          )}

          {step === 2 && (
            <StepShell
              title="Say hello to your customers"
              sub="The first thing visitors see. We wrote you a decent default — make it yours."
            >
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Hero image</Label>
                  <div className="grid grid-cols-4 gap-2.5">
                    {HERO_OPTIONS.map((src) => (
                      <button
                        key={src}
                        type="button"
                        aria-pressed={state.heroImage === src}
                        onClick={() => patch({ heroImage: src })}
                        className={cn(
                          "relative aspect-[4/3] overflow-hidden rounded-lg border-2 transition-all",
                          state.heroImage === src
                            ? "border-green"
                            : "border-transparent opacity-80 hover:opacity-100"
                        )}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={src}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                  <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-green underline-offset-4 hover:underline">
                    <Upload className="size-3.5" />
                    Or upload your own
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) patch({ heroImage: URL.createObjectURL(f) });
                      }}
                    />
                  </label>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="headline">Headline</Label>
                  <Input
                    id="headline"
                    value={state.heroHeadline}
                    onChange={(e) => patch({ heroHeadline: e.target.value })}
                    maxLength={60}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="subheadline">Subheadline</Label>
                  <Textarea
                    id="subheadline"
                    rows={2}
                    className="min-h-0"
                    value={state.heroSub}
                    onChange={(e) => patch({ heroSub: e.target.value })}
                    maxLength={140}
                  />
                </div>
              </div>
            </StepShell>
          )}

          {step === 3 && (
            <StepShell
              title="Add your first product"
              sub="Just the basics — photos, variants, and inventory come later. Or skip and add it from your dashboard."
            >
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="p-title">Product name</Label>
                  <Input
                    id="p-title"
                    placeholder="e.g. Ceramic pour-over set"
                    value={state.productTitle}
                    onChange={(e) => patch({ productTitle: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-price">Price (USD)</Label>
                  <Input
                    id="p-price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="48.00"
                    className="max-w-40"
                    value={state.productPrice}
                    onChange={(e) => patch({ productPrice: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Photo</Label>
                  <div className="flex flex-wrap items-center gap-2.5">
                    {PRODUCT_IMAGE_OPTIONS.map((src) => (
                      <button
                        key={src}
                        type="button"
                        aria-pressed={state.productImage === src}
                        onClick={() => patch({ productImage: src })}
                        className={cn(
                          "relative size-20 overflow-hidden rounded-lg border-2 transition-all",
                          state.productImage === src
                            ? "border-green"
                            : "border-transparent opacity-80 hover:opacity-100"
                        )}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={src}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                    <label className="flex size-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-line-strong text-xs text-ink-soft transition-colors hover:border-green hover:text-ink-body">
                      <Upload className="size-4" />
                      Upload
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f)
                            patch({ productImage: URL.createObjectURL(f) });
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </StepShell>
          )}

          {step === 4 && (
            <div className="animate-fade-up">
              <span className="flex size-14 items-center justify-center rounded-full bg-green-wash">
                <PartyPopper className="size-7 text-green" />
              </span>
              <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-ink">
                {state.name.trim() || "Your store"} is live.
              </h1>
              <p className="mt-3 max-w-md text-lg leading-relaxed text-ink-body">
                It&apos;s live right now at{" "}
                <span className="font-medium text-ink">
                  {createdSlug ?? state.slug}.awning.shop
                </span>
                . Share the link, or head to your dashboard to add the rest of
                your products.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" asChild>
                  <Link href={`/s/${createdSlug ?? state.slug}`}>
                    View your storefront
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/dashboard">Go to dashboard</Link>
                </Button>
              </div>
            </div>
          )}

          {/* step nav */}
          {step < 4 && (
            <div className="mt-10">
              <div className="flex items-center gap-3">
                {step > 0 && (
                  <Button variant="ghost" onClick={back} disabled={publishing}>
                    <ArrowLeft className="size-4" />
                    Back
                  </Button>
                )}
                <Button
                  size="lg"
                  disabled={!canContinue || publishing}
                  onClick={() => (step === 3 ? goLive() : next())}
                >
                  {publishing && <Loader2 className="size-4 animate-spin" />}
                  {step === 3
                    ? publishing
                      ? "Publishing…"
                      : state.productTitle.trim()
                        ? "Add product & go live"
                        : "Skip & go live"
                    : "Continue"}
                  {!publishing && <ArrowRight className="size-4" />}
                </Button>
                {step === 3 && state.productTitle.trim() === "" && (
                  <span className="text-xs text-ink-soft">
                    You can add products any time
                  </span>
                )}
              </div>
              {publishError && (
                <p className="mt-3 text-sm text-danger" role="alert">
                  {publishError}
                </p>
              )}
            </div>
          )}
        </div>

        {/* live preview column */}
        <div className="hidden lg:block">
          <div className="sticky top-10">
            <p className="mb-3 flex items-center gap-2 text-xs font-medium text-ink-soft">
              <span className="size-1.5 animate-pulse rounded-full bg-ok" aria-hidden />
              Live preview — updates as you choose
            </p>
            <BrowserFrame
              url={`${state.slug || "your-store"}.awning.shop`}
              className="transition-all duration-300"
            >
              <StorePreview store={previewStore} />
            </BrowserFrame>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepShell({
  title,
  sub,
  children,
}: {
  title: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <div className="animate-fade-up" key={title}>
      <h1 className="font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">
        {title}
      </h1>
      <p className="mt-2.5 text-ink-soft">{sub}</p>
      <div className="mt-8">{children}</div>
    </div>
  );
}
