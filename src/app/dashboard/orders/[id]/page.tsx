import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MapPin } from "lucide-react";
import { Card, PageHeader } from "@/components/dashboard/page-header";
import { OrderStatusControl } from "@/components/dashboard/order-status-control";
import { Button } from "@/components/ui/button";
import { requireCurrentStore } from "@/lib/auth";
import { getOrderById } from "@/server/orders";
import { listCustomers } from "@/server/customers";
import { formatDateTime, formatMoney } from "@/lib/utils";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const store = await requireCurrentStore();
  const order = await getOrderById(store.id, id);
  if (!order) notFound();
  const customer = (await listCustomers(store.id)).find(
    (c) => c.id === order.customerId,
  );
  const itemsTotal = order.items.reduce(
    (s, it) => s + it.price * it.quantity,
    0
  );

  return (
    <>
      <Button variant="ghost" size="sm" className="mb-3 -ml-2" asChild>
        <Link href="/dashboard/orders">
          <ArrowLeft className="size-3.5" />
          Orders
        </Link>
      </Button>
      <PageHeader
        title={`Order ${order.number}`}
        sub={`Placed ${formatDateTime(order.createdAt)}`}
        actions={
          <OrderStatusControl
            orderId={order.id}
            orderNumber={order.number}
            initial={order.status}
          />
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1.8fr_1fr]">
        {/* items */}
        <Card>
          <div className="divide-y divide-line">
            {order.items.map((it, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <span className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-line bg-canvas">
                  <Image
                    src={it.image}
                    alt=""
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">
                    {it.title}
                  </p>
                  {it.variant && (
                    <p className="text-xs text-ink-soft">{it.variant}</p>
                  )}
                </div>
                <p className="text-sm text-ink-soft">
                  {formatMoney(it.price)} × {it.quantity}
                </p>
                <p className="w-20 text-right text-sm font-medium text-ink">
                  {formatMoney(it.price * it.quantity)}
                </p>
              </div>
            ))}
          </div>
          <div className="space-y-2 border-t border-line p-4 text-sm">
            <div className="flex justify-between text-ink-soft">
              <span>Subtotal</span>
              <span>{formatMoney(itemsTotal)}</span>
            </div>
            <div className="flex justify-between text-ink-soft">
              <span>Shipping</span>
              <span>{itemsTotal >= 75 ? "Free" : formatMoney(8)}</span>
            </div>
            <div className="flex justify-between border-t border-line pt-2 text-[15px] font-semibold text-ink">
              <span>Total</span>
              <span>{formatMoney(order.total)}</span>
            </div>
          </div>
        </Card>

        {/* customer */}
        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-ink">Customer</h2>
            <p className="mt-3 text-sm font-medium text-ink">
              {order.customerName}
            </p>
            {customer && (
              <p className="text-xs text-ink-soft">
                {customer.ordersCount}{" "}
                {customer.ordersCount === 1 ? "order" : "orders"} ·{" "}
                {formatMoney(customer.totalSpent)} lifetime
              </p>
            )}
            <div className="mt-4 space-y-2.5 text-sm text-ink-body">
              <p className="flex items-center gap-2.5">
                <Mail className="size-3.5 shrink-0 text-ink-soft" />
                <a
                  href={`mailto:${order.customerEmail}`}
                  className="truncate hover:underline"
                >
                  {order.customerEmail}
                </a>
              </p>
              <p className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-ink-soft" />
                {order.shippingAddress}
              </p>
            </div>
            {customer && (
              <Button
                variant="outline"
                size="sm"
                className="mt-5 w-full"
                asChild
              >
                <Link href="/dashboard/customers">View customer history</Link>
              </Button>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-ink">Payment</h2>
            <p className="mt-2 text-sm text-ink-body">
              Paid by card via Stripe
            </p>
            <p className="text-xs text-ink-soft">
              Payout lands in your connected account in 2 business days.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
