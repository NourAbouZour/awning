import { currentHasFeature } from "@/lib/auth";
import type { ProductFormFeatures } from "@/components/dashboard/product-form";

/** Which paid product tools to show in the product form. */
export async function productFormFeatures(): Promise<ProductFormFeatures> {
  const [wholesale, aiSeo] = await Promise.all([
    currentHasFeature("wholesale"),
    currentHasFeature("aiSeo"),
  ]);
  return { wholesale, aiSeo, aiReady: Boolean(process.env.ANTHROPIC_API_KEY) };
}
