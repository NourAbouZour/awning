import { prisma } from "@/lib/db";
import { toCustomer } from "@/server/adapters";
import type { Customer } from "@/lib/types";

/** Customers for a store, with ordersCount/totalSpent computed from orders. */
export async function listCustomers(storeId: string): Promise<Customer[]> {
  const rows = await prisma.customer.findMany({
    where: { storeId },
    include: { orders: { select: { total: true } } },
    orderBy: { firstOrderAt: "desc" },
  });
  return rows.map((row) => {
    const ordersCount = row.orders.length;
    const totalSpent = row.orders.reduce(
      (sum, o) => sum + Number(o.total.toString()),
      0,
    );
    return toCustomer(row, ordersCount, Math.round(totalSpent));
  });
}
