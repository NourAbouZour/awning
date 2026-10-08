import { requireCurrentStore, getCurrentUser } from "@/lib/auth";
import { getStoreForUser } from "@/server/stores";
import { listProducts } from "@/server/products";
import type { Plan } from "@/lib/plan";
import { ProductsClient } from "./products-client";

export default async function ProductsPage() {
  const store = await requireCurrentStore();
  const [products, full, user] = await Promise.all([
    listProducts(store.id),
    getStoreForUser(store.userId),
    getCurrentUser(),
  ]);
  return (
    <ProductsClient
      products={products}
      categories={full?.categories ?? []}
      plan={(user?.plan as Plan) ?? "stall"}
    />
  );
}
