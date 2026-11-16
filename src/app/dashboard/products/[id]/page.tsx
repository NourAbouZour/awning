import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ProductForm } from "@/components/dashboard/product-form";
import { Button } from "@/components/ui/button";
import { requireCurrentStore } from "@/lib/auth";
import { getProductById } from "@/server/products";
import { getStoreById } from "@/server/stores";
import { productFormFeatures } from "../form-features";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const store = await requireCurrentStore();
  const product = await getProductById(store.id, id);
  if (!product) notFound();
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
        title={product.title}
        sub={product.sku ? `SKU ${product.sku}` : undefined}
      />
      <ProductForm
        product={product}
        categories={categories}
        features={features}
      />
    </>
  );
}
