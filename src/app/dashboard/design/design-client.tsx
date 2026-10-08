"use client";

/**
 * Store design editor — every control patches a local theme draft and the
 * preview re-renders live. "Publish" persists the draft via a server action.
 */
import * as React from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Loader2 } from "lucide-react";
import { Card, PageHeader } from "@/components/dashboard/page-header";
import { BrowserFrame } from "@/components/marketing/browser-frame";
import { StorePreview } from "@/components/marketing/store-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { FONT_PAIRINGS, type FontPairingId } from "@/lib/fonts";
import { saveDesign } from "@/app/dashboard/design/actions";
import { ImageUploadButton } from "@/components/ui/image-upload-button";
import type { HomeSection, Store } from "@/lib/types";
import { cn } from "@/lib/utils";

const COLOR_PRESETS = [
  "#f54a00",
  "#114b32",
  "#1d4fd7",
  "#9a1750",
  "#0f766e",
  "#b45309",
  "#6d28d9",
  "#111111",
];

const SECTION_LABELS: Record<string, string> = {
  hero: "Hero",
  collections: "Featured collections",
  carousel: "Best sellers carousel",
  story: "Brand story",
  trust: "Trust badges",
  newsletter: "Newsletter signup",
};

export function DesignClient({ initialStore }: { initialStore: Store }) {
  const [draft, setDraft] = React.useState<Store>(initialStore);
  const [saving, setSaving] = React.useState(false);
  const t = draft.theme;

  const patchTheme = (p: Partial<Store["theme"]>) =>
    setDraft((d) => ({ ...d, theme: { ...d.theme, ...p } }));

  function moveSection(index: number, dir: -1 | 1) {
    setDraft((d) => {
      const sections = [...d.theme.sections];
      const j = index + dir;
      if (j < 0 || j >= sections.length) return d;
      [sections[index], sections[j]] = [sections[j], sections[index]];
      return { ...d, theme: { ...d.theme, sections } };
    });
  }

  function toggleSection(id: HomeSection["id"], enabled: boolean) {
    setDraft((d) => ({
      ...d,
      theme: {
        ...d.theme,
        sections: d.theme.sections.map((s) =>
          s.id === id ? { ...s, enabled } : s,
        ),
      },
    }));
  }

  function save() {
    setSaving(true);
    React.startTransition(async () => {
      const res = await saveDesign({
        logoUrl: draft.logoUrl ?? null,
        theme: {
          brandColor: t.brandColor,
          fontPairing: t.fontPairing,
          announcement: t.announcement,
          heroImage: t.heroImage,
          heroHeadline: t.heroHeadline,
          heroSub: t.heroSub,
          heroCta: t.heroCta,
          storyImage: t.storyImage,
          storyTitle: t.storyTitle,
          storyBody: t.storyBody,
          footerText: t.footerText,
          socials: t.socials,
          sections: t.sections,
        },
      });
      setSaving(false);
      if (res.error) toast.error(res.error);
      else toast.success("Design published — your storefront is updated");
    });
  }

  return (
    <>
      <PageHeader
        title="Store design"
        sub="Changes preview instantly. Nothing goes live until you publish."
        actions={
          <Button size="sm" onClick={save} disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            {saving ? "Publishing…" : "Publish changes"}
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
        <div className="space-y-5">
          <Card className="space-y-5 p-5">
            <h2 className="text-sm font-semibold text-ink">Brand</h2>
            <div className="space-y-2">
              <Label htmlFor="logo-url">Logo image URL</Label>
              {draft.logoUrl ? (
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={draft.logoUrl}
                    alt="Logo"
                    className="h-10 max-w-36 rounded-md border border-line bg-canvas object-contain p-1.5"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDraft((d) => ({ ...d, logoUrl: undefined }))}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <ImageUploadButton
                    label="Upload logo"
                    onUploaded={(url) =>
                      setDraft((d) => ({ ...d, logoUrl: url }))
                    }
                  />
                  <span className="text-xs text-ink-soft">or</span>
                  <Input
                    id="logo-url"
                    placeholder="Paste a logo URL"
                    className="min-w-40 flex-1"
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        logoUrl: e.target.value.trim() || undefined,
                      }))
                    }
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Brand color</Label>
              <div className="flex flex-wrap items-center gap-2">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Use color ${c}`}
                    aria-pressed={t.brandColor === c}
                    onClick={() => patchTheme({ brandColor: c })}
                    className={cn(
                      "size-8 rounded-full border-2 transition-transform hover:scale-110",
                      t.brandColor === c ? "border-ink" : "border-transparent",
                    )}
                    style={{ background: c }}
                  />
                ))}
                <label className="relative flex h-8 cursor-pointer items-center overflow-hidden rounded-full border border-line-strong px-3 text-xs text-ink-soft hover:border-ink">
                  {t.brandColor}
                  <input
                    type="color"
                    aria-label="Custom brand color"
                    className="absolute inset-0 cursor-pointer opacity-0"
                    value={t.brandColor}
                    onChange={(e) => patchTheme({ brandColor: e.target.value })}
                  />
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Type pairing</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {FONT_PAIRINGS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={t.fontPairing === p.id}
                    onClick={() =>
                      patchTheme({ fontPairing: p.id as FontPairingId })
                    }
                    className={cn(
                      "rounded-lg border bg-paper p-3 text-left transition-all",
                      t.fontPairing === p.id
                        ? "border-green ring-2 ring-green/20"
                        : "border-line hover:border-line-strong",
                    )}
                  >
                    <span
                      className="block text-xl leading-none text-ink"
                      style={{
                        fontFamily: p.display,
                        fontWeight: p.displayWeight,
                      }}
                    >
                      Aa
                    </span>
                    <span className="mt-1.5 block text-xs font-medium text-ink">
                      {p.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <Card className="space-y-5 p-5">
            <h2 className="text-sm font-semibold text-ink">Homepage</h2>
            <div className="space-y-1.5">
              <Label htmlFor="announcement">Announcement bar</Label>
              <Input
                id="announcement"
                value={t.announcement}
                onChange={(e) => patchTheme({ announcement: e.target.value })}
                maxLength={80}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="headline">Hero headline</Label>
              <Input
                id="headline"
                value={t.heroHeadline}
                onChange={(e) => patchTheme({ heroHeadline: e.target.value })}
                maxLength={60}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sub">Hero subheadline</Label>
              <Textarea
                id="sub"
                rows={2}
                className="min-h-0"
                value={t.heroSub}
                onChange={(e) => patchTheme({ heroSub: e.target.value })}
                maxLength={140}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="cta">Hero button text</Label>
                <Input
                  id="cta"
                  value={t.heroCta}
                  onChange={(e) => patchTheme({ heroCta: e.target.value })}
                  maxLength={24}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hero-url">Hero image</Label>
                <div className="flex gap-2">
                  <Input
                    id="hero-url"
                    value={t.heroImage}
                    onChange={(e) => patchTheme({ heroImage: e.target.value })}
                    placeholder="Paste a URL or upload"
                    className="min-w-0 flex-1"
                  />
                  <ImageUploadButton
                    label="Upload"
                    onUploaded={(url) => patchTheme({ heroImage: url })}
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-ink">Sections</h2>
            <p className="mt-0.5 text-xs text-ink-soft">
              Toggle sections on or off and set their order.
            </p>
            <ul className="mt-4 space-y-1.5">
              {t.sections.map((s, i) => (
                <li
                  key={s.id}
                  className="flex items-center gap-3 rounded-lg border border-line bg-paper px-3 py-2"
                >
                  <span
                    className={cn(
                      "flex-1 text-[13px] font-medium",
                      s.enabled ? "text-ink" : "text-ink-soft",
                    )}
                  >
                    {SECTION_LABELS[s.id]}
                  </span>
                  <span className="flex gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Move ${SECTION_LABELS[s.id]} up`}
                      disabled={i === 0}
                      onClick={() => moveSection(i, -1)}
                    >
                      <ArrowUp className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Move ${SECTION_LABELS[s.id]} down`}
                      disabled={i === t.sections.length - 1}
                      onClick={() => moveSection(i, 1)}
                    >
                      <ArrowDown className="size-3.5" />
                    </Button>
                  </span>
                  <Switch
                    checked={s.enabled}
                    onCheckedChange={(v) => toggleSection(s.id, v)}
                    aria-label={`Show ${SECTION_LABELS[s.id]}`}
                  />
                </li>
              ))}
            </ul>
          </Card>

          <Card className="space-y-5 p-5">
            <h2 className="text-sm font-semibold text-ink">Footer & social</h2>
            <div className="space-y-1.5">
              <Label htmlFor="footer">Footer text</Label>
              <Input
                id="footer"
                value={t.footerText}
                onChange={(e) => patchTheme({ footerText: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {(["instagram", "tiktok", "twitter"] as const).map((k) => (
                <div key={k} className="space-y-1.5">
                  <Label htmlFor={k} className="capitalize">
                    {k}
                  </Label>
                  <Input
                    id={k}
                    value={t.socials[k] ?? ""}
                    placeholder="username"
                    onChange={(e) =>
                      patchTheme({
                        socials: { ...t.socials, [k]: e.target.value },
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="hidden xl:block">
          <div className="sticky top-8">
            <p className="mb-3 flex items-center gap-2 text-xs font-medium text-ink-soft">
              <span
                className="size-1.5 animate-pulse rounded-full bg-ok"
                aria-hidden
              />
              Live preview
            </p>
            <BrowserFrame url={`${draft.slug}.awning.shop`}>
              <StorePreview store={draft} />
            </BrowserFrame>
          </div>
        </div>
      </div>
    </>
  );
}
