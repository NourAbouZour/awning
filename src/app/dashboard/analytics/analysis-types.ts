import { z } from "zod/v4";

const name = z.string().max(160);
const money = z.number().finite();
const count = z.number().int().min(0).max(10_000_000);

/**
 * The numbers the Analytics page shows, in a compact form the AI reads.
 * Bounded so a hand-made request can't send an oversized prompt.
 */
export const SalesSnapshot = z.object({
  storeName: name,
  currency: z.string().max(8),
  rangeDays: z.number().int().min(1).max(366),
  revenue: money,
  previousRevenue: money,
  orders: count,
  previousOrders: count,
  averageOrder: money,
  previousAverageOrder: money,
  newCustomers: count,
  previousNewCustomers: count,
  /** Revenue over time: one point per day, or per week on long ranges. */
  revenueSeries: z
    .array(z.object({ period: name, revenue: money, orders: count }))
    .max(40),
  seriesGrain: z.enum(["day", "week"]),
  topByRevenue: z
    .array(z.object({ title: name, units: count, revenue: money }))
    .max(10),
  topByUnits: z
    .array(z.object({ title: name, units: count, revenue: money }))
    .max(10),
  payments: z
    .array(z.object({ method: name, orders: count, revenue: money }))
    .max(6),
  ordersByStatus: z.record(z.string().max(20), count),
  discountCodes: z
    .array(z.object({ code: name, timesUsed: count, totalDiscount: money }))
    .max(10),
  catalog: z.object({
    activeProducts: count,
    draftProducts: count,
    productsWithNoCollection: count,
    productsOnSale: count,
    activeDiscountCodes: count,
    /** Active products that sold nothing in this period. */
    notSelling: z.array(name).max(12),
    lowStock: z.array(z.object({ title: name, unitsLeft: count })).max(12),
    soldOut: z.array(name).max(12),
  }),
  audience: z.object({
    newsletterSubscribers: count,
    abandonedCarts: count,
  }),
});
export type SalesSnapshot = z.infer<typeof SalesSnapshot>;

/** What the AI sends back. */
export const SalesAnalysis = z.object({
  summary: z.string(),
  working: z.array(z.string()),
  watch: z.array(z.string()),
  actions: z.array(
    z.object({
      title: z.string(),
      why: z.string(),
      how: z.string(),
    }),
  ),
});
export type SalesAnalysis = z.infer<typeof SalesAnalysis>;
