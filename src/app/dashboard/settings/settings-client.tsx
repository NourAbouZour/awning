"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, PageHeader } from "@/components/dashboard/page-header";
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
import {
  deleteOwnStore,
  saveSettings,
  setOwnPlan,
} from "@/app/dashboard/settings/actions";
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

const PLAN_SUMMARY: Record<Plan, string> = {
  stall: "Free plan, up to 5 products.",
  shopfront:
    "Unlimited products, sales and discount codes, email marketing, abandoned carts, linked products and a custom domain.",
  arcade:
    "Everything in Shopfront, plus several stores, staff accounts, analytics with AI sales advice, wholesale prices, AI descriptions and SEO, no Shopleb branding, and an API.",
};

export function SettingsClient({
  store,
  plan,
  requestedPlan,
  billingPaid,
  isOwner,
}: {
  store: Store;
  plan: Plan;
  requestedPlan: Plan | null;
  billingPaid: boolean;
  isOwner: boolean;
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
  const [mapsEmbed, setMapsEmbed] = React.useState(store.mapsEmbed ?? "");
  const [hours, setHours] = React.useState<DayHours[]>(
    () => parseHours(store.hours) ?? defaultHours(),
  );
  const [currency, setCurrency] = React.useState(store.currency);
  const [shippingNote, setShippingNote] = React.useState(store.shippingNote);
  const [freeShipping, setFreeShipping] = React.useState(
    store.freeShipping != null ? String(store.freeShipping) : "",
  );
  const [freeShippingOn, setFreeShippingOn] = React.useState(
    store.freeShipping != null && store.freeShipping > 0,
  );
  const [saving, setSaving] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [confirmName, setConfirmName] = React.useState("");
  const [deleting, setDeleting] = React.useState(false);
  const nameMatches =
    confirmName.trim().toLowerCase() === store.name.trim().toLowerCase();

  function deleteStore() {
    setDeleting(true);
    React.startTransition(async () => {
      // On success the action redirects and never returns.
      const res = await deleteOwnStore(confirmName);
      if (res?.error) {
        setDeleting(false);
        toast.error(res.error);
      }
    });
  }

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
        mapsEmbed,
        hours: JSON.stringify(hours),
        currency,
        shippingNote,
        freeShipping: freeShippingOn ? freeShipping : "",
      });
      setSaving(false);
      if (res.error) toast.error(res.error);
      else toast.success("Settings saved");
    });
  }

  function changePlan(next: Plan) {
    if (next === (requestedPlan ?? plan)) return;
    React.startTransition(async () => {
      const res = await setOwnPlan(next);
      if (res.error) toast.error(res.error);
      else {
        toast.success(
          res.pending
            ? `Request sent. We'll be in touch to switch on ${PLAN_LABELS[next]}.`
            : next === plan
              ? "Plan request withdrawn"
              : `Switched to the ${PLAN_LABELS[next]} plan`,
        );
        router.refresh();
      }
    });
  }

  const districts = districtsFor(city);

  return (
    <>
      <PageHeader
        title="Settings"
        sub="Your plan, store details, contact and shipping."
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
              <p className="mt-0.5 max-w-md text-xs text-ink-soft">
                You&apos;re on {PLAN_LABELS[plan]}. {PLAN_SUMMARY[plan]}
              </p>
            </div>
            <Select
              value={requestedPlan ?? plan}
              onValueChange={(v) => changePlan(v as Plan)}
              disabled={!isOwner}
            >
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
          {requestedPlan && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-warn-wash px-3 py-2 text-xs text-warn">
              <p>
                You asked for <b>{PLAN_LABELS[requestedPlan]}</b>. We&apos;ll
                contact you to arrange payment by Whish or cash, then switch it
                on. Your store keeps running on {PLAN_LABELS[plan]} meanwhile.
              </p>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => changePlan(plan)}
                  className="font-semibold underline underline-offset-4"
                >
                  Cancel request
                </button>
              )}
            </div>
          )}
          {!requestedPlan && plan !== "stall" && !billingPaid && (
            <p className="rounded-lg bg-warn-wash px-3 py-2 text-xs text-warn">
              Payment pending, we&apos;ll be in touch to arrange it. Your store
              stays live meanwhile.
            </p>
          )}
          {!isOwner && (
            <p className="text-xs text-ink-soft">
              Only the store owner can change the plan.
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
                <span className="flex h-10 items-center border-r border-line bg-canvas px-3 text-sm text-ink-soft">
                  shopleb.com/s/
                </span>
                <input
                  id="slug"
                  className="h-10 min-w-0 flex-1 bg-transparent px-3.5 text-sm outline-none"
                  value={slug}
                  onChange={(e) => setSlug(slugify(e.target.value))}
                />
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
          <div className="space-y-1.5">
            <Label htmlFor="maps-embed">Google Maps embed code (optional)</Label>
            <Textarea
              id="maps-embed"
              rows={3}
              className="min-h-0 font-mono text-xs"
              value={mapsEmbed}
              onChange={(e) => setMapsEmbed(e.target.value)}
              placeholder='<iframe src="https://www.google.com/maps/embed?pb=..."></iframe>'
            />
            <p className="text-xs text-ink-soft">
              In Google Maps open your place, press Share, choose &quot;Embed a
              map&quot; and copy the HTML here. Your storefront then shows the
              map with a Get directions button. You can switch the map section
              on or off in Store design.
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
            <div className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2.5 sm:col-span-2">
              <div>
                <Label htmlFor="free-shipping-on">Offer free shipping</Label>
                <p className="mt-0.5 text-xs text-ink-soft">
                  {freeShippingOn
                    ? "Shown on your storefront and in the shopper's bag."
                    : "Off. Shoppers see no free shipping offer."}
                </p>
              </div>
              <Switch
                id="free-shipping-on"
                checked={freeShippingOn}
                onCheckedChange={setFreeShippingOn}
              />
            </div>
            <div className={freeShippingOn ? "space-y-1.5" : "hidden"}>
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
                Orders at or above this amount ship free. To change the strip
                at the top of your store, edit the announcement bar in Store
                design.
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
              placeholder="e.g. Delivery all over Lebanon in 2 to 4 days."
            />
            <p className="text-xs text-ink-soft">
              Shown to shoppers on product pages and at checkout.
            </p>
          </div>
        </Card>

        {isOwner && (
          <Card className="border-danger/30 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="max-w-md">
                <h2 className="text-sm font-semibold text-danger">
                  Delete this store
                </h2>
                <p className="mt-0.5 text-xs text-ink-soft">
                  Removes the storefront at shopleb.com/s/{store.slug} and
                  everything in it: products, collections, orders, customers,
                  messages and subscribers. This can&apos;t be undone. Your
                  account stays, so you can open a new store later.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-danger/40 text-danger hover:bg-danger-wash"
                onClick={() => {
                  setConfirmName("");
                  setDeleteOpen(true);
                }}
              >
                <Trash2 className="size-3.5" />
                Delete store
              </Button>
            </div>
          </Card>
        )}
      </div>

      <Dialog open={deleteOpen} onOpenChange={(v) => !deleting && setDeleteOpen(v)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {store.name} for good?</DialogTitle>
            <DialogDescription>
              Your storefront goes offline straight away and all of its
              products, orders, customers and subscribers are deleted. There is
              no way to get them back.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-delete">
              Type <b>{store.name}</b> to confirm
            </Label>
            <Input
              id="confirm-delete"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              autoComplete="off"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              Keep my store
            </Button>
            <Button
              className="bg-danger text-white hover:bg-danger/90"
              onClick={deleteStore}
              disabled={!nameMatches || deleting}
            >
              {deleting && <Loader2 className="size-4 animate-spin" />}
              {deleting ? "Deleting…" : "Delete store forever"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
