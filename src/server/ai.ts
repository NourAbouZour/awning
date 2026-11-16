import { prisma } from "@/lib/db";

/**
 * AI calls run on the platform owner's Anthropic key, so each store gets a
 * daily allowance instead of unlimited use.
 */
export const AI_DAILY_LIMIT = 20;

/** True when the server has Claude credentials. */
export function aiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/**
 * Count one AI call against the store's allowance for today. Returns false
 * once the store has used it up; the count starts again the next day (UTC).
 */
export async function takeAiCredit(storeId: string): Promise<boolean> {
  const today = new Date().toISOString().slice(0, 10);
  // A new day: start the count again.
  await prisma.store.updateMany({
    where: { id: storeId, OR: [{ aiDay: null }, { aiDay: { not: today } }] },
    data: { aiDay: today, aiCount: 0 },
  });
  // Take one only while under the limit (safe when two calls race).
  const res = await prisma.store.updateMany({
    where: { id: storeId, aiDay: today, aiCount: { lt: AI_DAILY_LIMIT } },
    data: { aiCount: { increment: 1 } },
  });
  return res.count === 1;
}

export const AI_LIMIT_MESSAGE = `You've used today's ${AI_DAILY_LIMIT} AI requests. They start again tomorrow.`;
export const AI_OFF_MESSAGE =
  "AI isn't switched on for Shopleb yet. Ask us from Contact Shopleb.";
