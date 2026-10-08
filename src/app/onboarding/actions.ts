"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import type { HomeSection } from "@/lib/types";

export interface CreateStoreInput {
  name: string;
  slug: string;
  logoUrl?: string;
  brandColor: string;
  fontPairing: string;
  heroImage: string;
  heroHeadline: string;
  heroSub: string;
  productTitle?: string;
  productPrice?: string;
  productImage?: string;
}

export interface CreateStoreResult {
  error?: string;
  slug?: string;
  alreadyExists?: boolean;
}

const DEFAULT_SECTIONS: HomeSection[] = [
  { id: "hero", enabled: true },
  { id: "collections", enabled: true },
  { id: "carousel", enabled: true },
  { id: "story", enabled: true },
  { id: "trust", enabled: true },
  { id: "newsletter", enabled: true },
];

const clean = (u?: string) => (u && !u.startsWith("blob:") ? u : "");

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1400&auto=format&fit=crop";

async function uniqueStoreSlug(base: string): Promise<string> {
  const root = slugify(base) || "store";
  let slug = root;
  let n = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const clash = await prisma.store.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!clash) return slug;
    n += 1;
    slug = `${root}-${n}`;
  }
}

export async function createStore(
  input: CreateStoreInput,
): Promise<CreateStoreResult> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please log in again." };

  const existing = await prisma.store.findUnique({
    where: { userId: user.id },
    select: { slug: true },
  });
  if (existing) return { slug: existing.slug, alreadyExists: true };

  if (input.name.trim().length < 2)
    return { error: "Your store needs a name." };

  const slug = await uniqueStoreSlug(input.slug || input.name);
  const heroImage = clean(input.heroImage);

  const price = Number(input.productPrice);

  await prisma.store.create({
    data: {
      userId: user.id,
      name: input.name.trim(),
      slug,
      logoText: input.name.trim(),
      logoUrl: clean(input.logoUrl) || null,
      tagline: "",
      contactEmail: user.email,
      phone: "",
      address: "",
      hours: "",
      currency: "USD",
      shippingNote: "Flat $8 shipping. Free over $75.",
      theme: {
        create: {
          brandColor: input.brandColor,
          fontPairing: input.fontPairing,
          announcement: "Free shipping over $50",
          heroImage,
          heroHeadline:
            input.heroHeadline.trim() || "Made with care. Shipped with speed.",
          heroSub: input.heroSub.trim(),
          heroCta: "Shop now",
          storyImage: "",
          storyTitle: `The ${input.name.trim()} story`,
          storyBody:
            "Tell your customers who you are and why you started. You can edit this any time from Store design.",
          footerText: `© ${input.name.trim()}`,
          instagram: null,
          tiktok: null,
          twitter: null,
          sections: DEFAULT_SECTIONS as unknown as Prisma.InputJsonValue,
        },
      },
      categories: {
        create: [{ name: "All", slug: "all", image: "" }],
      },
    },
  });

  // Optional first product.
  const title = input.productTitle?.trim();
  if (title) {
    const cat = await prisma.category.findFirst({
      where: { store: { slug } },
      select: { id: true, storeId: true },
    });
    if (cat) {
      await prisma.product.create({
        data: {
          storeId: cat.storeId,
          categoryId: cat.id,
          slug: slugify(title) || "product",
          title,
          description: "",
          details: "",
          price: new Prisma.Decimal(
            Number.isFinite(price) && price > 0 ? price : 0,
          ),
          images: [
            clean(input.productImage) || PLACEHOLDER_IMAGE,
          ] as unknown as Prisma.InputJsonValue,
          inventory: 10,
          sku: "",
          status: "active",
        },
      });
    }
  }

  return { slug };
}
