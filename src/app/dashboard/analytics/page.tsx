import Link from "next/link";
import { Download, Tag } from "lucide-react";
import { Card, PageHeader } from "@/components/dashboard/page-header";
import { LockedFeature } from "@/components/dashboard/locked-feature";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { currentHasFeature, requireCurrentStore } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cn, formatMoney } from "@/lib/utils";
import { RANGES, dayKey, parseRange, rangeWindow } from "./range";
import { SalesChart, type SalesPoint } from "./sales-chart";

const STATUS_LABELS = {
  pending: "Pending",
  paid: "Paid",
  fulfilled: "Fulfilled",
  shipped: "Shipped",
  cancelled: "Cancelled",
} as const;
type Status = keyof typeof STATUS_LABELS;

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Cash on delivery",
  whish: "Whish",
};

const num = (d: { toString(): string } | null | undefined) =>
  d ? Number(d.toString()) : 0;

/** Percent change vs the previous window, or null when there's nothing to compare to. */
function change(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const store = await requireCurrentStore();
  const header = (
    <PageHeader
      title="Analytics"
      sub="See what sells, who buys and how they pay."
    />
  );

  if (!(await currentHasFeature("analytics"))) {
    return (
      <>
        {header}
        <LockedFeature
          feature="analytics"
          title="Know what's working"
          description="Track revenue, best sellers, payment methods and discount codes over time, and download your orders as a spreadsheet."
        />
      </>
    );
  }

  const range = parseRange((await searchParams).range);
  const { start, prevStart } = rangeWindow(range);
  const currency = store.currency;

  const [orders, prevOrders, newCustomers, prevNewCustomers] =
    await Promise.all([
      prisma.order.findMany({
        where: { storeId: store.id, createdAt: { gte: start } },
        select: {
          total: true,
          status: true,
          paymentMethod: true,
          discountCode: true,
          discountAmount: true,
          createdAt: true,
          items: {
            select: {
              productId: true,
              title: true,
              quantity: true,
              price: true,
            },
          },
        },
      }),
      prisma.order.findMany({
        where: {
          storeId: store.id,
          createdAt: { gte: prevStart, lt: start },
          status: { not: "cancelled" },
        },
        select: { total: true },
      }),
      prisma.customer.count({
        where: { storeId: store.id, firstOrderAt: { gte: start } },
      }),
      prisma.customer.count({
        where: {
          storeId: store.id,
          firstOrderAt: { gte: prevStart, lt: start },
        },
      }),
    ]);

  // Cancelled orders stay in the status breakdown but never count as sales.
  const sold = orders.filter((o) => o.status !== "cancelled");
  const revenue = sold.reduce((s, o) => s + num(o.total), 0);
  const prevRevenue = prevOrders.reduce((s, o) => s + num(o.total), 0);
  const aov = sold.length ? revenue / sold.length : 0;
  const prevAov = prevOrders.length ? prevRevenue / prevOrders.length : 0;

  // Revenue by day.
  const buckets = new Map<string, { revenue: number; orders: number }>();
  for (let i = 0; i < range; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    buckets.set(dayKey(d), { revenue: 0, orders: 0 });
  }
  for (const o of sold) {
    const b = buckets.get(dayKey(o.createdAt));
    if (b) {
      b.revenue += num(o.total);
      b.orders += 1;
    }
  }
  const series: SalesPoint[] = [...buckets.entries()].map(([iso, b]) => ({
    date: new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    revenue: Math.round(b.revenue * 100) / 100,
    orders: b.orders,
  }));

  // Best sellers, grouped by product (or by title once a product is deleted).
  const products = new Map<
    string,
    { id: string | null; title: string; units: number; revenue: number }
  >();
  for (const o of sold) {
    for (const it of o.items) {
      const key = it.productId ?? `title:${it.title}`;
      const row = products.get(key) ?? {
        id: it.productId,
        title: it.title,
        units: 0,
        revenue: 0,
      };
      row.units += it.quantity;
      row.revenue += num(it.price) * it.quantity;
      products.set(key, row);
    }
  }
  const productRows = [...products.values()];
  const byRevenue = [...productRows]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);
  const byUnits = [...productRows]
    .sort((a, b) => b.units - a.units || b.revenue - a.revenue)
    .slice(0, 8);

  // Payment methods.
  const payments = new Map<string, { orders: number; revenue: number }>();
  for (const key of ["cash", "whish"]) payments.set(key, { orders: 0, revenue: 0 });
  for (const o of sold) {
    const p = payments.get(o.paymentMethod) ?? { orders: 0, revenue: 0 };
    p.orders += 1;
    p.revenue += num(o.total);
    payments.set(o.paymentMethod, p);
  }

  // Orders by status (all orders, cancelled included).
  const statusCounts = Object.fromEntries(
    (Object.keys(STATUS_LABELS) as Status[]).map((s) => [s, 0]),
  ) as Record<Status, number>;
  for (const o of orders) statusCounts[o.status as Status] += 1;

  // Discount codes.
  const codes = new Map<string, { times: number; total: number }>();
  for (const o of sold) {
    if (!o.discountCode) continue;
    const code = o.discountCode.toUpperCase();
    const c = codes.get(code) ?? { times: 0, total: 0 };
    c.times += 1;
    c.total += num(o.discountAmount);
    codes.set(code, c);
  }
  const codeRows = [...codes.entries()]
    .map(([code, c]) => ({ code, ...c }))
    .sort((a, b) => b.times - a.times || b.total - a.total);

  const stats = [
    {
      label: "Revenue",
      value: formatMoney(revenue, currency),
      delta: change(revenue, prevRevenue),
    },
    {
      label: "Orders",
      value: sold.length.toLocaleString("en-US"),
      delta: change(sold.length, prevOrders.length),
    },
    {
      label: "Average order",
      value: formatMoney(aov, currency),
      delta: change(aov, prevAov),
    },
    {
      label: "New customers",
      value: newCustomers.toLocaleString("en-US"),
      delta: change(newCustomers, prevNewCustomers),
    },
  ];

  return (
    <>
      <PageHeader
        title="Analytics"
        sub="See what sells, who buys and how they pay."
        actions={
          <>
            <nav
              aria-label="Report range"
              className="flex rounded-lg border border-line bg-paper p-0.5"
            >
              {RANGES.map((r) => (
                <Link
                  key={r}
                  href={`/dashboard/analytics?range=${r}`}
                  aria-current={r === range ? "page" : undefined}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
                    r === range
                      ? "bg-green-wash text-green"
                      : "text-ink-soft hover:text-ink",
                  )}
                >
                  {r} days
                </Link>
              ))}
            </nav>
            <Button variant="outline" size="sm" asChild>
              <a href={`/dashboard/analytics/export?range=${range}`} download>
                <Download className="size-3.5" />
                Download CSV
              </a>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <p className="text-[13px] text-ink-soft">{s.label}</p>
            <p className="mt-1.5 font-display text-[26px] font-bold tracking-tight text-ink">
              {s.value}
            </p>
            {s.delta === null ? (
              <p className="mt-0.5 text-xs text-ink-soft">
                None in the {range} days before
              </p>
            ) : (
              <p
                className={cn(
                  "mt-0.5 text-xs font-medium",
                  s.delta > 0
                    ? "text-ok"
                    : s.delta < 0
                      ? "text-danger"
                      : "text-ink-soft",
                )}
              >
                {s.delta > 0 ? "▲ " : s.delta < 0 ? "▼ " : ""}
                {Math.abs(s.delta)}% vs the {range} days before
              </p>
            )}
          </Card>
        ))}
      </div>

      <Card className="mt-5 p-5">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-ink">Revenue by day</h2>
          <p className="text-xs text-ink-soft">
            Last {range} days. Cancelled orders aren&apos;t counted.
          </p>
        </div>
        <SalesChart data={series} currency={currency} />
      </Card>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <ProductTable
          title="Top products by revenue"
          rows={byRevenue}
          currency={currency}
        />
        <ProductTable
          title="Top products by units sold"
          rows={byUnits}
          currency={currency}
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-ink">Sales by payment method</h2>
          <p className="text-xs text-ink-soft">Share of revenue</p>
          <ul className="mt-4 space-y-4">
            {[...payments.entries()].map(([method, p]) => {
              const share = revenue > 0 ? (p.revenue / revenue) * 100 : 0;
              return (
                <li key={method}>
                  <div className="flex items-baseline justify-between gap-3 text-[13px]">
                    <span className="font-medium text-ink">
                      {PAYMENT_LABELS[method] ?? method}
                    </span>
                    <span className="text-ink-soft">
                      {p.orders === 1 ? "1 order" : `${p.orders} orders`} ·{" "}
                      <span className="font-medium text-ink">
                        {formatMoney(p.revenue, currency)}
                      </span>
                    </span>
                  </div>
                  <Bar percent={share} />
                </li>
              );
            })}
          </ul>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-ink">Orders by status</h2>
          <p className="text-xs text-ink-soft">
            {orders.length === 1 ? "1 order" : `${orders.length} orders`} placed
            in this period
          </p>
          <ul className="mt-4 space-y-3">
            {(Object.keys(STATUS_LABELS) as Status[]).map((s) => {
              const count = statusCounts[s];
              const share = orders.length ? (count / orders.length) * 100 : 0;
              return (
                <li key={s}>
                  <div className="flex items-baseline justify-between text-[13px]">
                    <span className="text-ink-body">{STATUS_LABELS[s]}</span>
                    <span className="font-medium text-ink">{count}</span>
                  </div>
                  <Bar percent={share} muted={s === "cancelled"} />
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <Card className="mt-5">
        <div className="px-5 pt-5">
          <h2 className="text-sm font-semibold text-ink">Discount codes used</h2>
          <p className="text-xs text-ink-soft">
            How often each code was used and what it cost you
          </p>
        </div>
        {codeRows.length === 0 ? (
          <div className="flex items-center gap-3 px-5 py-8 text-sm text-ink-soft">
            <Tag className="size-4" />
            No discount codes were used in the last {range} days.
          </div>
        ) : (
          <div className="mt-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead className="text-right">Times used</TableHead>
                  <TableHead className="text-right">Total discount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codeRows.map((c) => (
                  <TableRow key={c.code}>
                    <TableCell className="font-mono text-[13px] font-medium text-ink">
                      {c.code}
                    </TableCell>
                    <TableCell className="text-right text-ink-body">
                      {c.times}
                    </TableCell>
                    <TableCell className="text-right font-medium text-ink">
                      {formatMoney(c.total, currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </>
  );
}

function Bar({ percent, muted }: { percent: number; muted?: boolean }) {
  return (
    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-canvas">
      <div
        className={cn("h-full rounded-full", muted ? "bg-ink/25" : "bg-green")}
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  );
}

function ProductTable({
  title,
  rows,
  currency,
}: {
  title: string;
  rows: { id: string | null; title: string; units: number; revenue: number }[];
  currency: string;
}) {
  return (
    <Card>
      <div className="px-5 pt-5">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
      </div>
      {rows.length === 0 ? (
        <p className="px-5 py-8 text-sm text-ink-soft">
          No sales in this period yet.
        </p>
      ) : (
        <div className="mt-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Units</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id ?? r.title}>
                  <TableCell className="max-w-[16rem] truncate text-ink">
                    {r.id ? (
                      <Link
                        href={`/dashboard/products/${r.id}`}
                        className="hover:underline"
                      >
                        {r.title}
                      </Link>
                    ) : (
                      r.title
                    )}
                  </TableCell>
                  <TableCell className="text-right text-ink-body">
                    {r.units}
                  </TableCell>
                  <TableCell className="text-right font-medium text-ink">
                    {formatMoney(r.revenue, currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}
