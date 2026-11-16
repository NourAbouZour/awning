"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, MessageCircle, ShoppingCart, X } from "lucide-react";
import { Card, PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { markCartRecovered } from "@/app/dashboard/abandoned/actions";
import { formatDateTime, formatMoney } from "@/lib/utils";

export interface AbandonedItem {
  title: string;
  variant: string | null;
  quantity: number;
  price: number;
}

export interface AbandonedCartRow {
  id: string;
  name: string;
  phone: string;
  email: string;
  items: AbandonedItem[];
  subtotal: number;
  createdAt: string;
}

/**
 * Digits for a wa.me link. Local Lebanese numbers ("03 123 456") get the 961
 * country code; numbers already carrying 961 (or a 00 prefix) are kept.
 */
function whatsappNumber(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("961")) return digits;
  if (digits.length === 8 && digits.startsWith("0")) {
    return `961${digits.slice(1)}`;
  }
  return digits;
}

function itemLabel(it: AbandonedItem) {
  const name = it.variant ? `${it.title} (${it.variant})` : it.title;
  return it.quantity > 1 ? `${it.quantity} x ${name}` : name;
}

function itemsSummary(items: AbandonedItem[], max = 3) {
  if (items.length === 0) return "";
  const shown = items.slice(0, max).map(itemLabel).join(", ");
  const rest = items.length - max;
  return rest > 0 ? `${shown} and ${rest} more` : shown;
}

function reminderText(cart: AbandonedCartRow, storeName: string) {
  const first = cart.name.trim().split(/\s+/)[0];
  const hello = first ? `Hi ${first}` : "Hi";
  const items = itemsSummary(cart.items, 5);
  const what = items ? `${items} in your cart` : "some items in your cart";
  return `${hello}, this is ${storeName}. You left ${what}. They're still here for you. Reply to this message if you'd like us to complete your order, or if you have any questions!`;
}

function whatsappLink(cart: AbandonedCartRow, storeName: string) {
  const number = whatsappNumber(cart.phone);
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(
    reminderText(cart, storeName),
  )}`;
}

export function AbandonedClient({
  carts,
  storeName,
  currency,
}: {
  carts: AbandonedCartRow[];
  storeName: string;
  currency: string;
}) {
  const router = useRouter();
  const [hidden, setHidden] = React.useState<Set<string>>(() => new Set());
  const [, startTransition] = React.useTransition();

  const visible = carts.filter((c) => !hidden.has(c.id));
  const waiting = visible.reduce((s, c) => s + c.subtotal, 0);

  function close(cart: AbandonedCartRow, how: "recovered" | "dismissed") {
    setHidden((h) => new Set(h).add(cart.id));
    startTransition(async () => {
      const res = await markCartRecovered(cart.id);
      if (res.error) {
        setHidden((h) => {
          const next = new Set(h);
          next.delete(cart.id);
          return next;
        });
        toast.error(res.error);
        return;
      }
      toast.success(
        how === "recovered" ? "Nice, cart marked as recovered" : "Cart dismissed",
      );
      router.refresh();
    });
  }

  return (
    <>
      <PageHeader
        title="Abandoned carts"
        sub={
          visible.length > 0
            ? `${visible.length} ${visible.length === 1 ? "shopper" : "shoppers"} left ${formatMoney(waiting, currency)} in their carts. A quick message often brings them back.`
            : "Shoppers who started checkout but didn't place the order."
        }
      />

      {visible.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart />}
          title="No abandoned carts"
          description="When a shopper fills in their details at checkout but doesn't place the order, their cart shows up here so you can follow up on WhatsApp."
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead className="hidden md:table-cell">Items</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
                <TableHead className="hidden sm:table-cell">Left</TableHead>
                <TableHead className="text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((c) => {
                const link = whatsappLink(c, storeName);
                const count = c.items.reduce((s, it) => s + it.quantity, 0);
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <span className="block font-medium text-ink">
                        {c.name || "No name given"}
                      </span>
                      {c.phone && (
                        <span className="block text-xs text-ink-body">
                          {c.phone}
                        </span>
                      )}
                      {c.email && (
                        <span className="block max-w-56 truncate text-xs text-ink-soft">
                          {c.email}
                        </span>
                      )}
                      <span className="mt-1 block text-xs text-ink-soft md:hidden">
                        {itemsSummary(c.items) || "No items"}
                      </span>
                    </TableCell>
                    <TableCell className="hidden max-w-72 md:table-cell">
                      <span className="block text-ink-body">
                        {itemsSummary(c.items) || "No items"}
                      </span>
                      <span className="block text-xs text-ink-soft">
                        {count} {count === 1 ? "item" : "items"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium text-ink">
                      {formatMoney(c.subtotal, currency)}
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap text-ink-soft sm:table-cell">
                      {formatDateTime(c.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        {link ? (
                          <Button size="sm" asChild>
                            <a href={link} target="_blank" rel="noopener noreferrer">
                              <MessageCircle className="size-4" />
                              Message on WhatsApp
                            </a>
                          </Button>
                        ) : (
                          <Button size="sm" disabled title="No phone number">
                            <MessageCircle className="size-4" />
                            Message on WhatsApp
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => close(c, "recovered")}
                        >
                          <Check className="size-4" />
                          Mark as recovered
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label={`Dismiss cart from ${c.name || "this shopper"}`}
                          title="Dismiss"
                          onClick={() => close(c, "dismissed")}
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </>
  );
}
