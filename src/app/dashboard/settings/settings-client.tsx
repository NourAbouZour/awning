"use client";

import * as React from "react";
import { toast } from "sonner";
import { CreditCard, Loader2 } from "lucide-react";
import { Card, PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { saveSettings, setOwnPlan } from "@/app/dashboard/settings/actions";
import { PLAN_LABELS, type Plan } from "@/lib/plan";
import type { DayHours, Store } from "@/lib/types";
import { slugify } from "@/lib/utils";
import { LEBANON_CITIES, districtsFor } from "@/lib/lebanon";
import { defaultHours, parseHours } from "@/lib/hours";

const CURRENCIES: [string, string][] = [
  ["USD", "US Dollar ($)"],
  ["LBP", "Lebanese Pound (ل.ل)"],
  ["EUR", "Euro (€)"],
  ["GBP", "British Pound (£)"],
  ["CAD", "Canadian Dollar (C$)"],
  ["AUD", "Australian Dollar (A$)"],
];

export function SettingsClient({
  store,
  plan,
  billingPaid,
}: {
  store: Store;
  plan: Plan;
  billingPaid: boolean;
}) {
  const router = useRouter();
  const [name, setName] = React.useState(store.name);
  const [slug, setSlug] = React.useState(store.slug);
  const [email, setEmail] = React.useState(store.contactEmail);
  const [phone, setPhone] = React.useState(store.phone);
  const [address, setAddress] = React.useState(store.address);
  const [city, setCity] = React.useState(store.city ?? "");
  const [district, setDistrict] = React.useState(store.district ?? "");
  const [mapsUrl, setMapsUrl] = React.useState(store.mapsUrl ?? "");
  const [hours, setHours] = React.useState<DayHours[]>(
    () => parseHours(store.hours) ?? defaultHours(),
  );
  const [currency, setCurrency] = React.useState(store.currency);
  const [shippingNote, setShippingNote] = React.useState(store.shippingNote);
  const [freeShipping, setFreeShipping] = React.useState(
    store.freeShipping != null ? String(store.freeShipping) : "",
  );
  const [saving, setSaving] = React.useState(false);

  function patchDay(i: number, p: Partial<DayHours>) {
    setHours((h) => h.map((d, idx) => (idx === i ? { ...d, ...p } : d)));
  }

  function save() {
    if (name.trim().length < 2) {
      toast.error("Your store needs a name");
      return;
    }
    setSaving(true);
    React.startTransition(async () => {
      const res = await saveSettings({
        name,
        slug,
        contactEmail: email,
        phone,
        address,
        city,
        district,
        mapsUrl,
        hours: JSON.stringify(hours),
        currency,
        shippingNote,
        freeShipping,
      });
      setSaving(false);
      if (res.error) toast.error(res.error);
      else toast.success("Settings saved");
    });
  }

  function changePlan(next: Plan) {
    if (next === plan) return;
    React.startTransition(async () => {
      const res = await setOwnPlan(next);
      if (res.error) toast.error(res.error);
      else {
        toast.success(`Switched to the ${PLAN_LABELS[next]} plan`);
        router.refresh();
      }
    });
  }

  const districts = districtsFor(city);

  return (
    <>
      <PageHeader
        title="Settings"
        sub="Store details, shipping, and payouts."
        actions={
          <Button size="sm" onClick={save} disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            {saving ? "Saving…" : "Save changes"}
          </Button>
        }
      />

      <div className="space-y-5">
        <Card className="space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-ink">Plan</h2>
              <p className="mt-0.5 text-xs text-ink-soft">
                {plan === "stall"
                  ? "Free plan, up to 5 products."
                  : "Unlimited products."}
              </p>
            </div>
            <Select value={plan} onValueChange={(v) => changePlan(v as Plan)}>
              <SelectTrigger className="h-9 w-40" aria-label="Your plan">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["stall", "shopfront", "arcade"] as const).map((p) => (
                  <SelectItem key={p} value={p}>
                    {PLAN_LABELS[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {plan !== "stall" && !billingPaid && (
            <p className="rounded-lg bg-warn-wash px-3 py-2 text-xs text-warn">
              Payment pending, we&apos;ll be in touch to arrange it. Your store
              stays live meanwhile.
            </p>
          )}
        </Card>

        <Card className="space-y-5 p-5">
          <h2 className="text-sm font-semibold text-ink">Store</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Store name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slug">Store address</Label>
              <div className="flex items-center overflow-hidden rounded-lg border border-line-strong bg-paper focus-within:border-green focus-within:ring-2 focus-within:ring-green/15">
                <input
                  id="slug"
                  className="h-10 min-w-0 flex-1 bg-transparent px-3.5 text-sm outline-none"
                  value={slug}
                  onChange={(e) => setSlug(slugify(e.target.value))}
                />
                <span className="border-l border-line bg-canvas px-3 text-sm text-ink-soft">
                  .shopleb.shop
                </span>
              </div>
              <p className="text-xs text-ink-soft">
                Changing this breaks old links, your previous address stops
                working immediately.
              </p>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="max-w-56" aria-label="Currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map(([v, l]) => (
                  <SelectItem key={v} value={v}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        <Card className="space-y-5 p-5">
          <h2 className="text-sm font-semibold text-ink">Contact details</h2>
          <p className="-mt-3 text-xs text-ink-soft">
            Shown on your storefront&apos;s contact page.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Address, Lebanon city + district dropdowns + Google Maps link */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>City / Governorate</Label>
              <Select
                value={city}
                onValueChange={(v) => {
                  setCity(v);
                  // Reset district if it doesn't belong to the new city.
                  if (!districtsFor(v).includes(district)) setDistrict("");
                }}
              >
                <SelectTrigger aria-label="City">
                  <SelectValue placeholder="Select a city" />
                </SelectTrigger>
                <SelectContent>
                  {LEBANON_CITIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>District</Label>
              <Select
                value={district}
                onValueChange={setDistrict}
                disabled={districts.length === 0}
              >
                <SelectTrigger aria-label="District">
                  <SelectValue
                    placeholder={
                      districts.length ? "Select a district" : "Pick a city first"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address">Street / building</Label>
            <Textarea
              id="address"
              rows={2}
              className="min-h-0"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Hamra Street, Pavilion building, 2nd floor"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="maps">Google Maps link (optional)</Label>
            <Input
              id="maps"
              value={mapsUrl}
              onChange={(e) => setMapsUrl(e.target.value)}
              placeholder="Paste a Google Maps link to your exact location"
            />
            <p className="text-xs text-ink-soft">
              Leave blank and we&apos;ll build a Maps link from your city,
              district, and street automatically.
            </p>
          </div>

          {/* Opening hours, day + time, not free text */}
          <div className="space-y-2">
            <Label>Opening hours</Label>
            <div className="divide-y divide-line rounded-lg border border-line">
              {hours.map((d, i) => (
                <div
                  key={d.day}
                  className="flex flex-wrap items-center gap-3 px-3 py-2.5"
                >
                  <span className="w-10 text-sm font-medium text-ink">
                    {d.day}
                  </span>
                  <Switch
                    checked={!d.closed}
                    onCheckedChange={(open) => patchDay(i, { closed: !open })}
                    aria-label={`${d.day} open`}
                  />
                  {d.closed ? (
                    <span className="text-sm text-ink-soft">Closed</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={d.open}
                        onChange={(e) => patchDay(i, { open: e.target.value })}
                        className="h-9 rounded-lg border border-line-strong bg-paper px-2.5 text-sm outline-none focus:border-green focus:ring-2 focus:ring-green/15"
                        aria-label={`${d.day} opening time`}
                      />
                      <span className="text-ink-soft">–</span>
                      <input
                        type="time"
                        value={d.close}
                        onChange={(e) => patchDay(i, { close: e.target.value })}
                        className="h-9 rounded-lg border border-line-strong bg-paper px-2.5 text-sm outline-none focus:border-green focus:ring-2 focus:ring-green/15"
                        aria-label={`${d.day} closing time`}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="space-y-5 p-5">
          <h2 className="text-sm font-semibold text-ink">Shipping</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="free-shipping">Free shipping over</Label>
              <div className="flex items-center overflow-hidden rounded-lg border border-line-strong bg-paper focus-within:border-green focus-within:ring-2 focus-within:ring-green/15">
                <span className="border-r border-line bg-canvas px-3 text-sm text-ink-soft">
                  {currency}
                </span>
                <input
                  id="free-shipping"
                  type="number"
                  min="0"
                  step="0.01"
                  className="h-10 min-w-0 flex-1 bg-transparent px-3.5 text-sm outline-none"
                  value={freeShipping}
                  onChange={(e) => setFreeShipping(e.target.value)}
                  placeholder="e.g. 50"
                />
              </div>
              <p className="text-xs text-ink-soft">
                Orders at or above this amount ship free. Leave blank for none.
              </p>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="shipping-note">Shipping note</Label>
            <Textarea
              id="shipping-note"
              rows={2}
              className="min-h-0"
              value={shippingNote}
              onChange={(e) => setShippingNote(e.target.value)}
              placeholder="e.g. Flat $8 shipping. Free over $75."
            />
            <p className="text-xs text-ink-soft">
              Shown to shoppers on product pages and at checkout.
            </p>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="flex size-10 items-center justify-center rounded-lg bg-[#635bff]/10">
                <CreditCard className="size-5 text-[#635bff]" />
              </span>
              <div>
                <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
                  Stripe payouts
                  <Badge variant="amber">Not connected</Badge>
                </h2>
                <p className="text-xs text-ink-soft">
                  Online card payments aren&apos;t enabled in this build -
                  checkout records orders directly.
                </p>
              </div>
            </div>
            <Button
              variant="dark"
              size="sm"
              onClick={() =>
                toast.info("Card payments aren't enabled in this build.")
              }
            >
              Connect Stripe
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}
