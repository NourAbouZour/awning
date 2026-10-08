import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { BuyBox } from "@/components/storefront/buy-box";
import { ProductCard } from "@/components/storefront/product-card";
import { ProductGallery } from "@/components/storefront/product-gallery";
import { getStoreBySlug } from "@/server/stores";

type Params = Promise<{ store: string; slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { store: storeSlug, slug } = await params;
  const store = await getStoreBySlug(storeSlug);
  const product = store?.products.find((p) => p.slug === slug);
  if (!store || !product) return {};
  return {
    title: product.title,
    description: product.description.slice(0, 155),
    openGraph: {
      title: `${product.title} · ${store.name}`,
      description: product.description.slice(0, 155),
      images: [{ url: product.images[0] }],
    },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { store: storeSlug, slug } = await params;
  const store = await getStoreBySlug(storeSlug);
  const product = store?.products.find(
    (p) => p.slug === slug && p.status === "active"
  );
  if (!store || !product) notFound();

  const related = store.products
    .filter(
      (p) =>
        p.id !== product.id &&
        p.status === "active" &&
        p.categoryId === product.categoryId
    )
    .slice(0, 4);
  const base = `/s/${store.slug}`;

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-12">
      {/* breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex items-center gap-1.5 text-sm text-sf-muted"
      >
        <Link href={`${base}/shop`} className="transition-colors hover:text-sf-ink">
          Shop
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span className="truncate text-sf-ink">{product.title}</span>
      </nav>

      <div className="grid gap-10 md:grid-cols-2 lg:gap-16">
        <ProductGallery images={product.images} title={product.title} />
        <BuyBox product={product} />
      </div>

      {related.length > 0 && (
        <section className="mt-20 md:mt-28">
          <h2 className="sf-display text-2xl md:text-3xl">
            You may also like
          </h2>
          <div className="mt-7 grid grid-cols-2 gap-x-5 gap-y-9 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
