import { prisma } from "@/lib/db";
import type { Plan } from "@/lib/plan";

export interface MerchantRow {
  id: string;
  name: string;
  email: string;
  plan: Plan;
  billingPaid: boolean;
  active: boolean;
  createdAt: string;
  storeName: string | null;
  storeSlug: string | null;
  productCount: number;
}

export async function listMerchants(): Promise<MerchantRow[]> {
  const users = await prisma.user.findMany({
    where: { role: "merchant" },
    include: {
      store: {
        select: {
          name: true,
          slug: true,
          _count: { select: { products: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    plan: u.plan as Plan,
    billingPaid: u.billingPaid,
    active: u.active,
    createdAt: u.createdAt.toISOString(),
    storeName: u.store?.name ?? null,
    storeSlug: u.store?.slug ?? null,
    productCount: u.store?._count.products ?? 0,
  }));
}

export interface SupportRow {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  handled: boolean;
  createdAt: string;
}

export async function listSupportRequests(): Promise<SupportRow[]> {
  const rows = await prisma.supportRequest.findMany({
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    subject: r.subject,
    message: r.message,
    handled: r.handled,
    createdAt: r.createdAt.toISOString(),
  }));
}

export interface AdminStats {
  merchants: number;
  paid: number;
  unpaid: number;
  suspended: number;
  unhandledSupport: number;
  byPlan: Record<Plan, number>;
}

export async function adminStats(): Promise<AdminStats> {
  const base = { role: "merchant" as const };
  const [merchants, paid, suspended, unhandledSupport, stall, shopfront, arcade] =
    await Promise.all([
      prisma.user.count({ where: base }),
      prisma.user.count({ where: { ...base, billingPaid: true } }),
      prisma.user.count({ where: { ...base, active: false } }),
      prisma.supportRequest.count({ where: { handled: false } }),
      prisma.user.count({ where: { ...base, plan: "stall" } }),
      prisma.user.count({ where: { ...base, plan: "shopfront" } }),
      prisma.user.count({ where: { ...base, plan: "arcade" } }),
    ]);
  return {
    merchants,
    paid,
    unpaid: merchants - paid,
    suspended,
    unhandledSupport,
    byPlan: { stall, shopfront, arcade },
  };
}
