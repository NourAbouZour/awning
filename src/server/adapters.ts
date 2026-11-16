import type {
  Product,
  ProductVariant,
  Category,
  Store,
  StoreTheme,
  Order,
  OrderItem,
  Customer,
  ContactMessage,
  HomeSection,
} from "@/lib/types";
import type { FontPairingId } from "@/lib/fonts";

// Prisma returns Decimal as an object and Json as already-parsed JS. These
// adapters map DB rows to the UI types in src/lib/types.ts. They are pure so
// they can be unit-tested without a live database.

type DecimalLike = { toString(): string } | number;

export function decToNum(d: DecimalLike | null | undefined): number | undefined {
  if (d === null || d === undefined) return undefined;
  return Number(d.toString());
}

function req(d: DecimalLike): number {
  return Number(d.toString());
}

interface VariantRow {
  id: string;
  name: string;
  price: DecimalLike | null;
  stock: number;
  isDefault?: boolean;
}

interface ProductRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  details: string;
  price: DecimalLike;
  compareAt: DecimalLike | null;
  categoryId: string | null;
  images: unknown;
  inventory: number;
  sku: string;
  status: "active" | "draft";
  featured: boolean;
  variantGroupLabel: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  wholesalePrice?: DecimalLike | null;
  wholesaleMinQty?: number | null;
  createdAt: Date;
  variants?: VariantRow[];
}

function toVariant(v: VariantRow): ProductVariant {
  const price = decToNum(v.price);
  return {
    id: v.id,
    name: v.name,
    ...(price !== undefined ? { price } : {}),
    stock: v.stock,
    ...(v.isDefault ? { isDefault: true } : {}),
  };
}

export function toProduct(row: ProductRow): Product {
  const compareAt = decToNum(row.compareAt);
  const variants = row.variants ?? [];
  const hasGroup = !!row.variantGroupLabel && variants.length > 0;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    details: row.details,
    price: req(row.price),
    ...(compareAt !== undefined ? { compareAt } : {}),
    images: Array.isArray(row.images) ? (row.images as string[]) : [],
    categoryId: row.categoryId ?? "",
    ...(row.seoTitle ? { seoTitle: row.seoTitle } : {}),
    ...(row.seoDescription ? { seoDescription: row.seoDescription } : {}),
    ...(decToNum(row.wholesalePrice) !== undefined
      ? { wholesalePrice: decToNum(row.wholesalePrice) }
      : {}),
    ...(row.wholesaleMinQty ? { wholesaleMinQty: row.wholesaleMinQty } : {}),
    ...(hasGroup
      ? {
          variantGroup: {
            label: row.variantGroupLabel as string,
            variants: variants.map(toVariant),
          },
        }
      : {}),
    inventory: row.inventory,
    sku: row.sku,
    status: row.status,
    ...(row.featured ? { featured: true } : {}),
    createdAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : String(row.createdAt),
  };
}

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  image: string;
}

export function toCategory(row: CategoryRow): Category {
  return { id: row.id, name: row.name, slug: row.slug, image: row.image };
}

/** Every home section, in its default order, for themes saved before a section existed. */
const ALL_SECTIONS: HomeSection["id"][] = [
  "hero",
  "collections",
  "carousel",
  "story",
  "trust",
  "map",
  "newsletter",
];

/** Append any section a saved theme doesn't know about yet (new ones start on). */
export function withAllSections(saved: HomeSection[]): HomeSection[] {
  const known = new Set(saved.map((s) => s.id));
  const missing = ALL_SECTIONS.filter((id) => !known.has(id)).map((id) => ({
    id,
    enabled: true,
  }));
  if (!missing.length) return saved;
  // Put the map just before the newsletter when it's the one missing.
  const out = [...saved];
  for (const m of missing) {
    const nl = out.findIndex((s) => s.id === "newsletter");
    if (m.id === "map" && nl >= 0) out.splice(nl, 0, m);
    else out.push(m);
  }
  return out;
}

interface ThemeRow {
  brandColor: string;
  fontPairing: string;
  announcement: string;
  showAnnouncement?: boolean;
  heroImage: string;
  heroHeadline: string;
  heroSub: string;
  heroCta: string;
  collectionsTitle: string;
  storyImage: string;
  storyTitle: string;
  storyBody: string;
  newsletterTitle: string;
  newsletterBody: string;
  footerText: string;
  instagram: string | null;
  tiktok: string | null;
  twitter: string | null;
  sections: unknown;
}

export function toTheme(row: ThemeRow): StoreTheme {
  const socials: StoreTheme["socials"] = {};
  if (row.instagram) socials.instagram = row.instagram;
  if (row.tiktok) socials.tiktok = row.tiktok;
  if (row.twitter) socials.twitter = row.twitter;
  return {
    brandColor: row.brandColor,
    fontPairing: row.fontPairing as FontPairingId,
    announcement: row.announcement,
    showAnnouncement: row.showAnnouncement ?? true,
    heroImage: row.heroImage,
    heroHeadline: row.heroHeadline,
    heroSub: row.heroSub,
    heroCta: row.heroCta,
    collectionsTitle: row.collectionsTitle ?? "Shop by collection",
    storyImage: row.storyImage,
    storyTitle: row.storyTitle,
    storyBody: row.storyBody,
    newsletterTitle: row.newsletterTitle ?? "Be first to every drop",
    newsletterBody:
      row.newsletterBody ??
      "Join the list for new releases and restocks. One or two emails a month, never more.",
    footerText: row.footerText,
    sections: withAllSections(
      Array.isArray(row.sections) ? (row.sections as HomeSection[]) : [],
    ),
    socials,
  };
}

interface StoreRow {
  id: string;
  name: string;
  slug: string;
  logoText: string;
  logoUrl: string | null;
  tagline: string;
  contactEmail: string;
  phone: string;
  address: string;
  city?: string | null;
  district?: string | null;
  mapsUrl?: string | null;
  mapsEmbed?: string | null;
  hours: string;
  currency: string;
  shippingNote: string;
  freeShipping?: DecimalLike | null;
  signupDiscountCode?: string | null;
  hideBranding?: boolean;
  user?: { plan: "stall" | "shopfront" | "arcade" } | null;
  theme: ThemeRow | null;
  categories: CategoryRow[];
  products: ProductRow[];
}

export function toStore(row: StoreRow): Store {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    logoText: row.logoText,
    ...(row.logoUrl ? { logoUrl: row.logoUrl } : {}),
    tagline: row.tagline,
    contactEmail: row.contactEmail,
    phone: row.phone,
    address: row.address,
    ...(row.city ? { city: row.city } : {}),
    ...(row.district ? { district: row.district } : {}),
    ...(row.mapsUrl ? { mapsUrl: row.mapsUrl } : {}),
    ...(row.mapsEmbed ? { mapsEmbed: row.mapsEmbed } : {}),
    hours: row.hours,
    currency: row.currency,
    shippingNote: row.shippingNote,
    ...(decToNum(row.freeShipping) !== undefined
      ? { freeShipping: decToNum(row.freeShipping) }
      : {}),
    ...(row.signupDiscountCode
      ? { signupDiscountCode: row.signupDiscountCode }
      : {}),
    ...(row.hideBranding ? { hideBranding: true } : {}),
    plan: row.user?.plan ?? "stall",
    theme: row.theme
      ? toTheme(row.theme)
      : ({} as StoreTheme),
    categories: row.categories.map(toCategory),
    products: row.products.map(toProduct),
  };
}

interface OrderItemRow {
  productId: string | null;
  title: string;
  image: string;
  variant: string | null;
  quantity: number;
  price: DecimalLike;
}

function toOrderItem(row: OrderItemRow): OrderItem {
  return {
    productId: row.productId ?? "",
    title: row.title,
    image: row.image,
    ...(row.variant ? { variant: row.variant } : {}),
    quantity: row.quantity,
    price: req(row.price),
  };
}

interface OrderRow {
  id: string;
  number: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  locationUrl?: string | null;
  paymentMethod?: string;
  discountCode?: string | null;
  discountAmount?: DecimalLike | null;
  shippingFee?: DecimalLike | null;
  total: DecimalLike;
  status: Order["status"];
  shippingAddress: string;
  createdAt: Date;
  items: OrderItemRow[];
}

export function toOrder(row: OrderRow): Order {
  return {
    id: row.id,
    number: row.number,
    customerId: row.customerId,
    customerName: row.customerName,
    customerEmail: row.customerEmail,
    customerPhone: row.customerPhone ?? "",
    ...(row.locationUrl ? { locationUrl: row.locationUrl } : {}),
    paymentMethod: row.paymentMethod ?? "cash",
    ...(row.discountCode ? { discountCode: row.discountCode } : {}),
    ...(decToNum(row.discountAmount) !== undefined
      ? { discountAmount: decToNum(row.discountAmount) }
      : {}),
    ...(decToNum(row.shippingFee) !== undefined
      ? { shippingFee: decToNum(row.shippingFee) }
      : {}),
    items: row.items.map(toOrderItem),
    total: req(row.total),
    status: row.status,
    createdAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : String(row.createdAt),
    shippingAddress: row.shippingAddress,
  };
}

interface CustomerRow {
  id: string;
  name: string;
  email: string | null;
  phone?: string;
  location: string;
  firstOrderAt: Date;
}

export function toCustomer(
  row: CustomerRow,
  ordersCount: number,
  totalSpent: number,
): Customer {
  return {
    id: row.id,
    name: row.name,
    email: row.email ?? "",
    phone: row.phone ?? "",
    location: row.location,
    ordersCount,
    totalSpent,
    firstOrderAt:
      row.firstOrderAt instanceof Date
        ? row.firstOrderAt.toISOString()
        : String(row.firstOrderAt),
  };
}

interface MessageRow {
  id: string;
  name: string;
  email: string;
  subject: string;
  body: string;
  read: boolean;
  createdAt: Date;
}

export function toMessage(row: MessageRow): ContactMessage {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    subject: row.subject,
    body: row.body,
    read: row.read,
    createdAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : String(row.createdAt),
  };
}
