import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ProductForm } from "@/components/dashboard/product-form";
import { Button } from "@/components/ui/button";
import { requireCurrentStore } from "@/lib/auth";
import { getProductById } from "@/server/products";
import { getStoreForUser } from "@/server/stores";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const store = await requireCurrentStore();
  const product = await getProductById(store.id, id);
  if (!product) notFound();
  const full = await getStoreForUser(store.userId);
  const categories = full?.categories ?? [];

  return (
    <>
      <Button variant="ghost" size="sm" className="mb-3 -ml-2" asChild>
        <Link href="/dashboard/products">
          <ArrowLeft className="size-3.5" />
          Products
        </Link>
      </Button>
      <PageHeader title={product.title} sub={`SKU ${product.sku}`} />
      <ProductForm product={product} categories={categories} />
    </>
  );
}
