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
}

interface ProductRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  details: string;
  price: DecimalLike;
  compareAt: DecimalLike | null;
  categoryId: string;
  images: unknown;
  inventory: number;
  sku: string;
  status: "active" | "draft";
  featured: boolean;
  variantGroupLabel: string | null;
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
    categoryId: row.categoryId,
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

interface ThemeRow {
  brandColor: string;
  fontPairing: string;
  announcement: string;
  heroImage: string;
  heroHeadline: string;
  heroSub: string;
  heroCta: string;
  storyImage: string;
  storyTitle: string;
  storyBody: string;
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
    heroImage: row.heroImage,
    heroHeadline: row.heroHeadline,
    heroSub: row.heroSub,
    heroCta: row.heroCta,
    storyImage: row.storyImage,
    storyTitle: row.storyTitle,
    storyBody: row.storyBody,
    footerText: row.footerText,
    sections: Array.isArray(row.sections) ? (row.sections as HomeSection[]) : [],
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
  hours: string;
  currency: string;
  shippingNote: string;
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
    hours: row.hours,
    currency: row.currency,
    shippingNote: row.shippingNote,
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
  email: string;
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
    email: row.email,
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
