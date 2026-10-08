import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/lib/types";

const map: Record<
  OrderStatus,
  { label: string; variant: "green" | "amber" | "blue" | "red" | "neutral" }
> = {
  paid: { label: "Paid", variant: "amber" },
  fulfilled: { label: "Fulfilled", variant: "blue" },
  shipped: { label: "Shipped", variant: "green" },
  cancelled: { label: "Cancelled", variant: "red" },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { label, variant } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}
