"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ORDER_STAGES,
  OrderStatusBadge,
  orderStage,
} from "@/components/dashboard/status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { updateOrderStatus } from "@/app/dashboard/orders/actions";
import type { OrderStatus } from "@/lib/types";

export function OrderStatusControl({
  orderId,
  orderNumber,
  initial,
  onChanged,
}: {
  orderId: string;
  orderNumber: string;
  initial: OrderStatus;
  /** Called after the new status is saved. */
  onChanged?: (status: OrderStatus) => void;
}) {
  const router = useRouter();
  const [status, setStatus] = React.useState<OrderStatus>(initial);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <OrderStatusBadge status={status} />
      <Select
        value={status}
        onValueChange={(v) => {
          const prev = status;
          const next = v as OrderStatus;
          setStatus(next);
          React.startTransition(async () => {
            const res = await updateOrderStatus(orderId, next);
            if (res.error) {
              setStatus(prev);
              toast.error(res.error);
            } else {
              toast.success(
                `${orderNumber} marked ${orderStage(next).label.toLowerCase()}`,
              );
              onChanged?.(next);
              router.refresh();
            }
          });
        }}
      >
        <SelectTrigger className="h-9 w-44" aria-label="Change order status">
          <span className="text-[13px]">Change status…</span>
        </SelectTrigger>
        <SelectContent>
          {ORDER_STAGES.map((f) => (
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
