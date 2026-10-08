import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ProductForm } from "@/components/dashboard/product-form";
import { Button } from "@/components/ui/button";
import { requireCurrentStore } from "@/lib/auth";
import { getStoreForUser } from "@/server/stores";

export default async function NewProductPage() {
  const store = await requireCurrentStore();
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
      <PageHeader
        title="Add product"
        sub="It appears in your storefront the moment you set it active."
      />
      <ProductForm categories={categories} />
    </>
  );
}
