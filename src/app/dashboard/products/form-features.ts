import { currentHasFeature } from "@/lib/auth";
import { aiConfigured } from "@/server/ai";
import type { ProductFormFeatures } from "@/components/dashboard/product-form";

/** Which paid product tools to show in the product form. */
export async function productFormFeatures(): Promise<ProductFormFeatures> {
  const [wholesale, aiSeo, sales, upsell] = await Promise.all([
    currentHasFeature("wholesale"),
    currentHasFeature("aiSeo"),
    currentHasFeature("sales"),
    currentHasFeature("upsell"),
  ]);
  return {
    wholesale,
    aiSeo,
    sales,
    upsell,
    aiReady: aiConfigured(),
  };
}
