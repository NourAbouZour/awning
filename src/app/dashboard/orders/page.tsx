import { requireCurrentStore } from "@/lib/auth";
import { listOrders } from "@/server/orders";
import { OrdersClient } from "./orders-client";

export default async function OrdersPage() {
  const store = await requireCurrentStore();
  const orders = await listOrders(store.id);
  return <OrdersClient orders={orders} />;
}
