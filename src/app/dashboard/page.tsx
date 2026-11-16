import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Card, PageHeader } from "@/components/dashboard/page-header";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import {
  LOW_STOCK_AT,
  LowStockChart,
  lowStockItems,
} from "@/components/dashboard/low-stock-chart";
import { OrderStatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireCurrentStore } from "@/lib/auth";
import { listOrders } from "@/server/orders";
import { getRevenueSeries } from "@/server/orders";
import { listProducts } from "@/server/products";
import { Stagger, StaggerItem, AnimatedNumber } from "@/components/ui/motion";
import { formatDateTime, formatMoney } from "@/lib/utils";

export default async function DashboardHome() {
  const currentStore = await requireCurrentStore();
  const [orders, revenueSeries, products] = await Promise.all([
    listOrders(currentStore.id),
    getRevenueSeries(currentStore.id),
    listProducts(currentStore.id),
  ]);
  const lowStock = lowStockItems(products);
  const soldOut = lowStock.filter((i) => i.units === 0).length;
  const today = revenueSeries[revenueSeries.length - 1];
  const week = revenueSeries.slice(-7);
  const prevWeek = revenueSeries.slice(-14, -7);
  const weekRevenue = week.reduce((s, d) => s + d.revenue, 0);
  const prevWeekRevenue = prevWeek.reduce((s, d) => s + d.revenue, 0);
  const weekOrders = week.reduce((s, d) => s + d.orders, 0);
  const weekDelta =
    prevWeekRevenue > 0
      ? Math.round(((weekRevenue - prevWeekRevenue) / prevWeekRevenue) * 100)
      : weekRevenue > 0
        ? 100
        : 0;
  const avgOrder = weekRevenue / Math.max(weekOrders, 1);
  const recentOrders = orders.slice(0, 5);

  const stats = [
    { label: "Sales today", value: today.revenue, format: "money" as const },
    {
      label: "Sales this week",
      value: weekRevenue,
      format: "money" as const,
      delta: weekDelta,
    },
    { label: "Orders this week", value: weekOrders, format: "plain" as const },
    { label: "Average order", value: avgOrder, format: "money" as const },
  ];

  return (
    <>
      <PageHeader
        title="Good morning"
        sub={`Here's how ${currentStore.name} is doing.`}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href={`/s/${currentStore.slug}`} target="_blank">
              View storefront
              <ArrowUpRight className="size-3.5" />
            </Link>
          </Button>
        }
      />

      {/* stats */}
      <Stagger className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <StaggerItem key={s.label}>
            <Card className="p-5">
              <p className="text-[13px] text-ink-soft">{s.label}</p>
              <p className="mt-1.5 font-display text-[26px] font-bold tracking-tight text-ink">
                <AnimatedNumber value={s.value} format={s.format} />
              </p>
              {typeof s.delta === "number" && (
                <p
                  className={`mt-0.5 text-xs font-medium ${
                    s.delta >= 0 ? "text-ok" : "text-danger"
                  }`}
                >
                  {s.delta >= 0 ? "▲" : "▼"} {Math.abs(s.delta)}% vs last week
                </p>
              )}
            </Card>
          </StaggerItem>
        ))}
      </Stagger>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.7fr_1fr]">
        {/* revenue */}
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-ink">Revenue</h2>
              <p className="text-xs text-ink-soft">Last 30 days</p>
            </div>
          </div>
          <RevenueChart data={revenueSeries} />
        </Card>

        {/* low stock */}
        <Card className="p-5">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-ink">Low stock</h2>
              <p className="text-xs text-ink-soft">
                {lowStock.length === 0
                  ? `Units left, ${LOW_STOCK_AT} or fewer`
                  : `${lowStock.length} ${lowStock.length === 1 ? "item" : "items"} at ${LOW_STOCK_AT} or fewer${
                      soldOut > 0 ? `, ${soldOut} sold out` : ""
                    }`}
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/products">
                Products
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
          <LowStockChart items={lowStock} />
        </Card>
      </div>

      {/* recent orders */}
      <Card className="mt-5">
        <div className="flex items-center justify-between px-5 pt-5">
          <h2 className="text-sm font-semibold text-ink">Recent orders</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/orders">
              All orders
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
        <div className="mt-2">
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
              {recentOrders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>
                    <Link
                      href={`/dashboard/orders/${o.id}`}
                      className="font-medium text-ink hover:underline"
                    >
                      {o.number}
                    </Link>
                  </TableCell>
                  <TableCell className="text-ink-body">
                    {o.customerName}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="flex -space-x-2">
                      {o.items.slice(0, 3).map((it, i) => (
                        <span
                          key={i}
                          className="relative size-7 overflow-hidden rounded-full border-2 border-paper"
                        >
                          <Image
                            src={it.image}
                            alt={it.title}
                            fill
                            sizes="28px"
                            className="object-cover"
                          />
                        </span>
                      ))}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-ink-soft sm:table-cell">
                    {formatDateTime(o.createdAt)}
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge status={o.status} />
                  </TableCell>
                  <TableCell className="text-right font-medium text-ink">
                    {formatMoney(o.total, currentStore.currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </>
  );
}
