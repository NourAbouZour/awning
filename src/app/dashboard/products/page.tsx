import { requireCurrentStore, getCurrentPlan } from "@/lib/auth";
import { getStoreById } from "@/server/stores";
import { listProducts } from "@/server/products";
import { ProductsClient } from "./products-client";

export default async function ProductsPage() {
  const store = await requireCurrentStore();
  const [products, full, plan] = await Promise.all([
    listProducts(store.id),
    getStoreById(store.id),
    getCurrentPlan(),
  ]);
  return (
    <ProductsClient
      products={products}
      categories={full?.categories ?? []}
      plan={plan}
    />
  );
}
