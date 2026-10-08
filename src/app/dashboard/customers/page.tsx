import { requireCurrentStore } from "@/lib/auth";
import { listCustomers } from "@/server/customers";
import { listOrders } from "@/server/orders";
import { CustomersClient } from "./customers-client";

export default async function CustomersPage() {
  const store = await requireCurrentStore();
  const [customers, orders] = await Promise.all([
    listCustomers(store.id),
    listOrders(store.id),
  ]);
  return <CustomersClient customers={customers} orders={orders} />;
}
