"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, Search, Users } from "lucide-react";
import { Card, PageHeader } from "@/components/dashboard/page-header";
import { OrderStatusBadge } from "@/components/dashboard/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import type { Customer, Order } from "@/lib/types";
import { cn, formatDate, formatMoney } from "@/lib/utils";

export function CustomersClient({
  customers,
  orders,
}: {
  customers: Customer[];
  orders: Order[];
}) {
  const [query, setQuery] = React.useState("");
  const [openId, setOpenId] = React.useState<string | null>(null);

  const filtered = customers.filter(
    (c) =>
      !query ||
      `${c.name} ${c.email} ${c.location}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );

  return (
    <>
      <PageHeader
        title="Customers"
        sub={`${customers.length} people have bought from you`}
      />

      <Card>
        <div className="border-b border-line p-4">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, or city"
              className="h-9 pl-9"
              aria-label="Search customers"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<Users />}
              title="No customers match"
              description="Try a different search — or share your store link to find your first customers."
            />
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {filtered.map((c) => {
              const theirOrders = orders.filter((o) => o.customerId === c.id);
              const open = openId === c.id;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : c.id)}
                    aria-expanded={open}
                    className="flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-canvas/70"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-green-wash text-sm font-semibold text-green">
                      {c.name
                        .split(" ")
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join("")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">
                        {c.name}
                      </span>
                      <span className="block truncate text-xs text-ink-soft">
                        {c.email} · {c.location}
                      </span>
                    </span>
                    <span className="hidden text-right sm:block">
                      <span className="block text-sm font-medium text-ink">
                        {formatMoney(c.totalSpent)}
                      </span>
                      <span className="block text-xs text-ink-soft">
                        {c.ordersCount}{" "}
                        {c.ordersCount === 1 ? "order" : "orders"} since{" "}
                        {formatDate(c.firstOrderAt)}
                      </span>
                    </span>
                    <ChevronDown
                      className={cn(
                        "size-4 shrink-0 text-ink-soft transition-transform",
                        open && "rotate-180",
                      )}
                    />
                  </button>
                  {open && (
                    <div className="border-t border-line bg-canvas/50 px-4 py-3">
                      {theirOrders.length === 0 ? (
                        <p className="py-2 text-sm text-ink-soft">
                          No orders recorded for this customer yet.
                        </p>
                      ) : (
                        <ul className="space-y-1">
                          {theirOrders.map((o) => (
                            <li key={o.id}>
                              <Link
                                href={`/dashboard/orders/${o.id}`}
                                className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-paper"
                              >
                                <span className="font-medium text-ink">
                                  {o.number}
                                </span>
                                <span className="text-xs text-ink-soft">
                                  {formatDate(o.createdAt)} · {o.items.length}{" "}
                                  {o.items.length === 1 ? "item" : "items"}
                                </span>
                                <span className="ml-auto">
                                  <OrderStatusBadge status={o.status} />
                                </span>
                                <span className="w-16 text-right font-medium text-ink">
                                  {formatMoney(o.total)}
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
