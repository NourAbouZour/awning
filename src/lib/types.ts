/**
 * UI-layer types. These mirror the eventual Prisma schema (User, Store,
 * StoreTheme, Product, Variant, Category, Order, OrderItem, Customer,
 * ContactMessage) so swapping mock data for a database later is mechanical.
 */
import type { FontPairingId } from "@/lib/fonts";

export type HomeSectionId =
  | "hero"
  | "collections"
  | "carousel"
  | "story"
  | "trust"
  | "newsletter";

export interface HomeSection {
  id: HomeSectionId;
  enabled: boolean;
}

export interface StoreTheme {
  brandColor: string;
  fontPairing: FontPairingId;
  announcement: string;
  heroImage: string;
  heroHeadline: string;
  heroSub: string;
  heroCta: string;
  storyImage: string;
  storyTitle: string;
  storyBody: string;
  footerText: string;
  sections: HomeSection[];
  socials: { instagram?: string; tiktok?: string; twitter?: string };
}

export interface ProductVariant {
  id: string;
  name: string; // e.g. "US 9" or "50ml"
  price?: number; // overrides product price when set
  stock: number;
}

export interface VariantGroup {
  label: string; // "Size", "Shade"
  variants: ProductVariant[];
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  description: string;
  details: string; // shipping & returns accordion copy lives on store
  price: number;
  compareAt?: number;
  images: string[];
  categoryId: string;
  variantGroup?: VariantGroup;
  inventory: number;
  sku: string;
  status: "active" | "draft";
  featured?: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
}

export interface Store {
  id: string;
  name: string;
  slug: string;
  logoText: string;
  logoUrl?: string;
  tagline: string;
  contactEmail: string;
  phone: string;
  address: string;
  hours: string;
  currency: string;
  shippingNote: string;
  theme: StoreTheme;
  categories: Category[];
  products: Product[];
}

export type OrderStatus = "paid" | "fulfilled" | "shipped" | "cancelled";

export interface OrderItem {
  productId: string;
  title: string;
  image: string;
  variant?: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  number: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
  shippingAddress: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  location: string;
  ordersCount: number;
  totalSpent: number;
  firstOrderAt: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  body: string;
  createdAt: string;
  read: boolean;
}

export interface CartLine {
  productId: string;
  variantId?: string;
  quantity: number;
}
