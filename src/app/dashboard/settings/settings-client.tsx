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
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { saveSettings, setOwnPlan } from "@/app/dashboard/settings/actions";
import { PLAN_LABELS, type Plan } from "@/lib/plan";
import type { Store } from "@/lib/types";
import { slugify } from "@/lib/utils";

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
  const [hours, setHours] = React.useState(store.hours);
  const [currency, setCurrency] = React.useState(store.currency);
  const [shippingNote, setShippingNote] = React.useState(store.shippingNote);
  const [saving, setSaving] = React.useState(false);

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
        hours,
        currency,
        shippingNote,
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
                  ? "Free plan — up to 5 products."
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
              Payment pending — we&apos;ll be in touch to arrange it. Your store
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
                  .awning.shop
                </span>
              </div>
              <p className="text-xs text-ink-soft">
                Changing this breaks old links — your previous address stops
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
                {[
                  ["USD", "US Dollar ($)"],
                  ["EUR", "Euro (€)"],
                  ["GBP", "British Pound (£)"],
                  ["CAD", "Canadian Dollar (C$)"],
                  ["AUD", "Australian Dollar (A$)"],
                ].map(([v, l]) => (
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
          <div className="space-y-1.5">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              rows={2}
              className="min-h-0"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hours">Opening hours</Label>
            <Input
              id="hours"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
            />
          </div>
        </Card>

        <Card className="space-y-5 p-5">
          <h2 className="text-sm font-semibold text-ink">Shipping</h2>
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
                  Online card payments aren&apos;t enabled in this build —
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
