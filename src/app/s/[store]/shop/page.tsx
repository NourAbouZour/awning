import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ShopClient } from "./shop-client";

export const metadata: Metadata = { title: "Shop" };

export default function ShopPage() {
  return (
    <Suspense fallback={<ShopFallback />}>
      <ShopClient />
    </Suspense>
  );
}

function ShopFallback() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-10 md:px-8 md:py-14">
      <Skeleton className="h-12 w-40" />
      <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-9 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="aspect-[4/5] rounded-xl" />
            <Skeleton className="mt-3 h-4 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
