import { requireCurrentStore } from "@/lib/auth";
import { getStoreForUser } from "@/server/stores";
import { CategoriesClient } from "./categories-client";

export default async function CategoriesPage() {
  const store = await requireCurrentStore();
  const full = await getStoreForUser(store.userId);
  const categories = full?.categories ?? [];
  const products = full?.products ?? [];
  const counts: Record<string, number> = {};
  for (const c of categories) {
    counts[c.id] = products.filter((p) => p.categoryId === c.id).length;
  }
  return <CategoriesClient categories={categories} counts={counts} />;
}
