import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ProductForm } from "@/components/dashboard/product-form";
import { Button } from "@/components/ui/button";
import { requireCurrentStore } from "@/lib/auth";
import { getStoreById } from "@/server/stores";
import { productFormFeatures } from "../form-features";

export default async function NewProductPage() {
  const store = await requireCurrentStore();
  const full = await getStoreById(store.id);
  const categories = full?.categories ?? [];
  const features = await productFormFeatures();
  return (
    <>
      <Button variant="ghost" size="sm" className="mb-3 -ml-2" asChild>
        <Link href="/dashboard/products">
          <ArrowLeft className="size-3.5" />
          Products
        </Link>
      </Button>
      <PageHeader
        title="Add product"
        sub="It appears in your storefront the moment you set it active."
      />
      <ProductForm categories={categories} features={features} />
    </>
  );
}
