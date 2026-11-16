"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Mail,
  MapPin,
  Navigation,
  Phone,
  Search,
  ShoppingCart,
} from "lucide-react";
import { Card, PageHeader } from "@/components/dashboard/page-header";
import { OrderStatusControl } from "@/components/dashboard/order-status-control";
import { OrderStatusBadge } from "@/components/dashboard/status-badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { normalizePhone } from "@/lib/product";
import type { Order, OrderStatus } from "@/lib/types";
import { formatDateTime, formatMoney } from "@/lib/utils";

type Filter = "all" | OrderStatus;

export function OrdersClient({
  orders,
  currency,
}: {
  orders: Order[];
  currency: string;
}) {
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<Filter>("all");
  const [openId, setOpenId] = React.useState<string | null>(null);

  const filtered = orders.filter((o) => {
    if (filter !== "all" && o.status !== filter) return false;
    if (
      query &&
      !`${o.number} ${o.customerName} ${o.customerEmail} ${o.customerPhone}`
        .toLowerCase()
        .includes(query.toLowerCase())
    )
      return false;
    return true;
  });

  const open = orders.find((o) => o.id === openId) ?? null;
  const newCount = orders.filter((o) => o.status === "pending").length;

  return (
    <>
      <PageHeader
        title="Orders"
        sub={`${orders.length} ${orders.length === 1 ? "order" : "orders"}, newest first. Double-click an order to see everything and change its status.`}
      />

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
          <div className="relative min-w-52 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by order number, name, phone or email"
              className="h-9 pl-9"
              aria-label="Search orders"
            />
          </div>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">
                New{newCount > 0 ? ` (${newCount})` : ""}
              </TabsTrigger>
              <TabsTrigger value="paid">Paid</TabsTrigger>
              <TabsTrigger value="fulfilled">Packed</TabsTrigger>
              <TabsTrigger value="shipped">On its way</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<ShoppingCart />}
              title={orders.length === 0 ? "No orders yet" : "No orders match"}
              description={
                orders.length === 0
                  ? "When a customer places an order on your store, it shows up here."
                  : "Try a different search, or clear the status filter."
              }
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="hidden md:table-cell">Items</TableHead>
                <TableHead className="hidden sm:table-cell">Placed</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((o) => (
                <TableRow
                  key={o.id}
                  onDoubleClick={() => setOpenId(o.id)}
                  className="cursor-pointer select-none"
                  title="Double-click to open this order"
                >
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => setOpenId(o.id)}
                      className="font-medium text-ink hover:underline"
                    >
                      {o.number}
                    </button>
                  </TableCell>
                  <TableCell>
                    <span className="block text-ink-body">{o.customerName}</span>
                    <span className="block text-xs text-ink-soft">
                      {o.customerPhone || o.customerEmail}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="flex items-center gap-2">
                      <span className="flex -space-x-2">
                        {o.items.slice(0, 3).map((it, i) => (
                          <span
                            key={i}
                            className="relative size-7 overflow-hidden rounded-full border-2 border-paper bg-canvas"
                          >
                            {it.image && (
                              <Image
                                src={it.image}
                                alt=""
                                fill
                                sizes="28px"
                                className="object-cover"
                              />
                            )}
                          </span>
                        ))}
                      </span>
                      <span className="text-xs text-ink-soft">
                        {o.items.reduce((s, it) => s + it.quantity, 0)}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-ink-soft sm:table-cell">
                    {formatDateTime(o.createdAt)}
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge status={o.status} />
                  </TableCell>
                  <TableCell className="text-right font-medium text-ink">
                    {formatMoney(o.total, currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <div className="border-t border-line px-4 py-3 text-xs text-ink-soft">
          Showing {filtered.length} of {orders.length} orders
        </div>
      </Card>

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpenId(null)}>
        <DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto">
          {open && <OrderDetails key={open.id} order={open} currency={currency} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Everything about one order, with the status control. */
function OrderDetails({ order, currency }: { order: Order; currency: string }) {
  const itemsTotal = order.items.reduce((s, it) => s + it.price * it.quantity, 0);
  const whatsapp = order.customerPhone
    ? `https://wa.me/${normalizePhone(order.customerPhone)}`
    : null;

  return (
    <>
      <DialogHeader>
        <DialogTitle>Order {order.number}</DialogTitle>
        <DialogDescription>
          Placed {formatDateTime(order.createdAt)}
        </DialogDescription>
      </DialogHeader>

      <div className="rounded-lg border border-line bg-canvas p-3.5">
        <p className="mb-2 text-xs font-medium text-ink-soft">Status</p>
        <OrderStatusControl
          orderId={order.id}
          orderNumber={order.number}
          initial={order.status}
        />
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Customer
          </h3>
          <p className="mt-2 text-sm font-medium text-ink">{order.customerName}</p>
          <div className="mt-2 space-y-2 text-sm text-ink-body">
            {order.customerPhone && (
              <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <Phone className="size-3.5 shrink-0 text-ink-soft" />
                <a href={`tel:${order.customerPhone}`} className="hover:underline">
                  {order.customerPhone}
                </a>
                {whatsapp && (
                  <a
                    href={whatsapp}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-green hover:underline"
                  >
                    WhatsApp
                  </a>
                )}
              </p>
            )}
            {order.customerEmail && (
              <p className="flex items-center gap-2.5">
                <Mail className="size-3.5 shrink-0 text-ink-soft" />
                <a
                  href={`mailto:${order.customerEmail}`}
                  className="truncate hover:underline"
                >
                  {order.customerEmail}
                </a>
              </p>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Delivery
          </h3>
          <p className="mt-2 flex items-start gap-2.5 text-sm text-ink-body">
            <MapPin className="mt-0.5 size-3.5 shrink-0 text-ink-soft" />
            <span className="whitespace-pre-line">{order.shippingAddress}</span>
          </p>
          {order.locationUrl && (
            <a
              href={order.locationUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-green hover:underline"
            >
              <Navigation className="size-3.5" />
              Open customer&apos;s location in Maps
            </a>
          )}
          <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Payment
          </h3>
          <p className="mt-2 text-sm text-ink-body">
            {order.paymentMethod === "whish" ? "Whish" : "Cash on delivery"}
            <span className="text-ink-soft">
              {order.status === "pending"
                ? " · not paid yet"
                : order.status === "cancelled"
                  ? " · cancelled"
                  : " · marked paid"}
            </span>
          </p>
        </div>
      </div>

      <h3 className="mt-6 text-xs font-semibold uppercase tracking-wide text-ink-soft">
        Items
      </h3>
      <div className="mt-2 divide-y divide-line rounded-lg border border-line">
        {order.items.map((it, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <span className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-line bg-canvas">
              {it.image && (
                <Image src={it.image} alt="" fill sizes="48px" className="object-cover" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{it.title}</p>
              {it.variant && <p className="text-xs text-ink-soft">{it.variant}</p>}
            </div>
            <p className="text-sm text-ink-soft">
              {formatMoney(it.price, currency)} × {it.quantity}
            </p>
            <p className="w-20 text-right text-sm font-medium text-ink">
              {formatMoney(it.price * it.quantity, currency)}
            </p>
          </div>
        ))}
        <div className="space-y-1.5 p-3 text-sm">
          <div className="flex justify-between text-ink-soft">
            <span>Subtotal</span>
            <span>{formatMoney(itemsTotal, currency)}</span>
          </div>
          {order.discountAmount ? (
            <div className="flex justify-between text-ink-soft">
              <span>
                Discount{order.discountCode ? ` (${order.discountCode})` : ""}
              </span>
              <span>−{formatMoney(order.discountAmount, currency)}</span>
            </div>
          ) : null}
          <div className="flex justify-between border-t border-line pt-1.5 text-[15px] font-semibold text-ink">
            <span>Total</span>
            <span>{formatMoney(order.total, currency)}</span>
          </div>
        </div>
      </div>

      <p className="mt-4 text-right text-xs">
        <Link
          href={`/dashboard/orders/${order.id}`}
          className="text-ink-soft underline-offset-4 hover:text-ink hover:underline"
        >
          Open as a full page
        </Link>
      </p>
    </>
  );
}
