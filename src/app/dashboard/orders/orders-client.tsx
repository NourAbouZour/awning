"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, ShoppingCart } from "lucide-react";
import { Card, PageHeader } from "@/components/dashboard/page-header";
import { OrderStatusBadge } from "@/components/dashboard/status-badge";
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
import type { Order, OrderStatus } from "@/lib/types";
import { formatDateTime, formatMoney } from "@/lib/utils";

type Filter = "all" | OrderStatus;

export function OrdersClient({ orders }: { orders: Order[] }) {
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<Filter>("all");

  const filtered = orders.filter((o) => {
    if (filter !== "all" && o.status !== filter) return false;
    if (
      query &&
      !`${o.number} ${o.customerName} ${o.customerEmail}`
        .toLowerCase()
        .includes(query.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <>
      <PageHeader title="Orders" sub={`${orders.length} orders, newest first`} />

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
          <div className="relative min-w-52 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by order number, name, or email"
              className="h-9 pl-9"
              aria-label="Search orders"
            />
          </div>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="paid">Paid</TabsTrigger>
              <TabsTrigger value="fulfilled">Fulfilled</TabsTrigger>
              <TabsTrigger value="shipped">Shipped</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<ShoppingCart />}
              title="No orders match"
              description="Try a different search, or clear the status filter."
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
                <TableRow key={o.id}>
                  <TableCell>
                    <Link
                      href={`/dashboard/orders/${o.id}`}
                      className="font-medium text-ink hover:underline"
                    >
                      {o.number}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span className="block text-ink-body">{o.customerName}</span>
                    <span className="block text-xs text-ink-soft">
                      {o.customerEmail}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="flex items-center gap-2">
                      <span className="flex -space-x-2">
                        {o.items.slice(0, 3).map((it, i) => (
                          <span
                            key={i}
                            className="relative size-7 overflow-hidden rounded-full border-2 border-paper"
                          >
                            <Image
                              src={it.image}
                              alt=""
                              fill
                              sizes="28px"
                              className="object-cover"
                            />
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
                    {formatMoney(o.total)}
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
    </>
  );
}
