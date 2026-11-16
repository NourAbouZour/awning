import { prisma } from "@/lib/db";
import type { Plan } from "@/lib/plan";

export interface MerchantRow {
  id: string;
  name: string;
  email: string;
  /** The platform owner's own account (it can own stores too). */
  isAdmin: boolean;
  plan: Plan;
  /** A plan the merchant asked for, waiting for approval. */
  requestedPlan: Plan | null;
  planRequestedAt: string | null;
  billingPaid: boolean;
  active: boolean;
  createdAt: string;
  storeCount: number;
  stores: { id: string; name: string; slug: string; productCount: number }[];
  storeName: string | null;
  storeSlug: string | null;
  productCount: number;
  discountCode: string | null;
}

export async function listMerchants(): Promise<MerchantRow[]> {
  const users = await prisma.user.findMany({
    // Every shop account, plus the platform owner's account when it owns a store.
    where: {
      OR: [
        { role: "merchant" },
        { role: "superadmin", stores: { some: {} } },
      ],
    },
    include: {
      stores: {
        select: {
          id: true,
          name: true,
          slug: true,
          signupDiscountCode: true,
          _count: { select: { products: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    // Pending plan requests first, then newest accounts.
    orderBy: [{ planRequestedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
  });
  return users.map((u) => {
    const store = u.stores[0];
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      isAdmin: u.role === "superadmin",
      plan: u.plan as Plan,
      requestedPlan: (u.requestedPlan as Plan | null) ?? null,
      planRequestedAt: u.planRequestedAt?.toISOString() ?? null,
      billingPaid: u.billingPaid,
      active: u.active,
      createdAt: u.createdAt.toISOString(),
      storeCount: u.stores.length,
      stores: u.stores.map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        productCount: s._count.products,
      })),
      storeName: store?.name ?? null,
      storeSlug: store?.slug ?? null,
      productCount: u.stores.reduce((n, s) => n + s._count.products, 0),
      discountCode: store?.signupDiscountCode ?? null,
    };
  });
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
  pendingPlans: number;
  byPlan: Record<Plan, number>;
}

export async function adminStats(): Promise<AdminStats> {
  const base = { role: "merchant" as const };
  const [merchants, paid, suspended, unhandledSupport, stall, shopfront, arcade, pendingPlans] =
    await Promise.all([
      prisma.user.count({ where: base }),
      prisma.user.count({ where: { ...base, billingPaid: true } }),
      prisma.user.count({ where: { ...base, active: false } }),
      prisma.supportRequest.count({ where: { handled: false } }),
      prisma.user.count({ where: { ...base, plan: "stall" } }),
      prisma.user.count({ where: { ...base, plan: "shopfront" } }),
      prisma.user.count({ where: { ...base, plan: "arcade" } }),
      prisma.user.count({ where: { ...base, requestedPlan: { not: null } } }),
    ]);
  return {
    merchants,
    paid,
    unpaid: merchants - paid,
    suspended,
    unhandledSupport,
    pendingPlans,
    byPlan: { stall, shopfront, arcade },
  };
}

export interface PlanRequestRow {
  userId: string;
  name: string;
  email: string;
  storeName: string | null;
  storeSlug: string | null;
  currentPlan: Plan;
  requestedPlan: Plan;
  requestedAt: string;
}

/** Merchants waiting for the platform owner to approve a plan change. */
export async function listPlanRequests(): Promise<PlanRequestRow[]> {
  const users = await prisma.user.findMany({
    where: { role: "merchant", requestedPlan: { not: null } },
    include: {
      stores: {
        select: { name: true, slug: true },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
    orderBy: { planRequestedAt: "asc" },
  });
  return users.map((u) => ({
    userId: u.id,
    name: u.name,
    email: u.email,
    storeName: u.stores[0]?.name ?? null,
    storeSlug: u.stores[0]?.slug ?? null,
    currentPlan: u.plan as Plan,
    requestedPlan: u.requestedPlan as Plan,
    requestedAt: (u.planRequestedAt ?? u.createdAt).toISOString(),
  }));
}

export interface PasswordResetRow {
  id: string;
  /** False when no account uses the email that was typed. */
  hasAccount: boolean;
  name: string;
  email: string;
  role: "merchant" | "staff" | "superadmin";
  storeName: string | null;
  storePhone: string | null;
  requestedAt: string;
  /** When an already generated code stops working, if one is still live. */
  codeExpiresAt: string | null;
}

/** People who said they forgot their password and are waiting for a code. */
export async function listPasswordResets(): Promise<PasswordResetRow[]> {
  const rows = await prisma.passwordReset.findMany({
    where: { usedAt: null },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          role: true,
          stores: {
            select: { name: true, phone: true },
            orderBy: { createdAt: "asc" },
            take: 1,
          },
          staffStore: { select: { name: true, phone: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  const now = Date.now();
  return rows.map((r) => {
    if (!r.user) {
      return {
        id: r.id,
        hasAccount: false,
        name: "",
        email: r.email,
        role: "merchant" as const,
        storeName: null,
        storePhone: null,
        requestedAt: r.createdAt.toISOString(),
        codeExpiresAt: null,
      };
    }
    const store = r.user.stores[0] ?? r.user.staffStore ?? null;
    return {
      id: r.id,
      hasAccount: true,
      name: r.user.name,
      email: r.user.email,
      role: r.user.role,
      storeName: store?.name ?? null,
      storePhone: store?.phone || null,
      requestedAt: r.createdAt.toISOString(),
      codeExpiresAt:
        r.codeHash && r.codeExpiresAt && r.codeExpiresAt.getTime() > now
          ? r.codeExpiresAt.toISOString()
          : null,
    };
  });
}

/** Counts for the admin menu badges: what is waiting for the platform owner. */
export async function adminWaiting(): Promise<{
  planRequests: number;
  passwordResets: number;
  newMessages: number;
}> {
  const [planRequests, passwordResets, newMessages] = await Promise.all([
    prisma.user.count({
      where: { role: "merchant", requestedPlan: { not: null } },
    }),
    prisma.passwordReset.count({ where: { usedAt: null } }),
    prisma.supportRequest.count({ where: { handled: false } }),
  ]);
  return { planRequests, passwordResets, newMessages };
}
