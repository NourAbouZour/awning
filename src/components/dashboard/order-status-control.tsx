"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { OrderStatusBadge } from "@/components/dashboard/status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { updateOrderStatus } from "@/app/dashboard/orders/actions";
import type { OrderStatus } from "@/lib/types";

const FLOW: { value: OrderStatus; label: string; hint: string }[] = [
  { value: "paid", label: "Paid", hint: "Payment received, not yet packed" },
  { value: "fulfilled", label: "Fulfilled", hint: "Packed and ready to ship" },
  { value: "shipped", label: "Shipped", hint: "On its way to the customer" },
  { value: "cancelled", label: "Cancelled", hint: "Refunded and closed" },
];

export function OrderStatusControl({
  orderId,
  orderNumber,
  initial,
}: {
  orderId: string;
  orderNumber: string;
  initial: OrderStatus;
}) {
  const router = useRouter();
  const [status, setStatus] = React.useState<OrderStatus>(initial);

  return (
    <div className="flex items-center gap-3">
      <OrderStatusBadge status={status} />
      <Select
        value={status}
        onValueChange={(v) => {
          const prev = status;
          setStatus(v as OrderStatus);
          React.startTransition(async () => {
            const res = await updateOrderStatus(orderId, v as OrderStatus);
            if (res.error) {
              setStatus(prev);
              toast.error(res.error);
            } else {
              toast.success(
                `${orderNumber} marked ${FLOW.find((f) => f.value === v)?.label.toLowerCase()}`,
              );
              router.refresh();
            }
          });
        }}
      >
        <SelectTrigger className="h-9 w-44" aria-label="Change order status">
          <span className="text-[13px]">Change status…</span>
        </SelectTrigger>
        <SelectContent>
          {FLOW.map((f) => (
            <SelectItem key={f.value} value={f.value}>
              <span className="block">{f.label}</span>
              <span className="block text-xs text-ink-soft">{f.hint}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
