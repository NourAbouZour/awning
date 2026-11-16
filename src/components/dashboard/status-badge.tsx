import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/lib/types";

/** Labels and hints for every order stage, in the order they happen. */
export const ORDER_STAGES: {
  value: OrderStatus;
  label: string;
  hint: string;
  variant: "green" | "amber" | "blue" | "red" | "neutral";
}[] = [
  {
    value: "pending",
    label: "New",
    hint: "Just placed, not confirmed or paid yet",
    variant: "amber",
  },
  {
    value: "paid",
    label: "Paid",
    hint: "Confirmed and paid, not yet packed",
    variant: "blue",
  },
  {
    value: "fulfilled",
    label: "Packed",
    hint: "Packed and ready to go out",
    variant: "blue",
  },
  {
    value: "shipped",
    label: "On its way",
    hint: "Out for delivery to the customer",
    variant: "green",
  },
  {
    value: "cancelled",
    label: "Cancelled",
    hint: "Cancelled and closed",
    variant: "red",
  },
];

export function orderStage(status: OrderStatus) {
  return ORDER_STAGES.find((s) => s.value === status) ?? ORDER_STAGES[0];
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { label, variant } = orderStage(status);
  return <Badge variant={variant}>{label}</Badge>;
}
