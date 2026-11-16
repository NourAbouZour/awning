"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { assertFeature, isStoreOwner, requireCurrentStore } from "@/lib/auth";
import { deliverWebhook } from "@/server/webhooks";

export interface DevelopersActionState {
  error?: string;
  apiKey?: string | null;
  message?: string;
}

const OWNER_ONLY = "Only the store owner can manage API access.";

async function ownerStore() {
  await assertFeature("api");
  if (!(await isStoreOwner())) return null;
  return requireCurrentStore();
}

function newApiKey() {
  return `sl_live_${randomBytes(16).toString("hex")}`;
}

/** Create a key, or replace the current one (the old key stops working). */
export async function generateApiKey(): Promise<DevelopersActionState> {
  const store = await ownerStore();
  if (!store) return { error: OWNER_ONLY };
  const apiKey = newApiKey();
  await prisma.store.update({ where: { id: store.id }, data: { apiKey } });
  revalidatePath("/dashboard/developers");
  return { apiKey };
}

export async function revokeApiKey(): Promise<DevelopersActionState> {
  const store = await ownerStore();
  if (!store) return { error: OWNER_ONLY };
  await prisma.store.update({
    where: { id: store.id },
    data: { apiKey: null },
  });
  revalidatePath("/dashboard/developers");
  return { apiKey: null };
}

function isPrivateHost(hostname: string) {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local"))
    return true;
  if (h.includes(":")) {
    return h === "::1" || /^(fc|fd|fe80|::ffff:)/.test(h);
  }
  const ip = h.split(".").map(Number);
  if (ip.length !== 4 || ip.some((n) => !Number.isInteger(n))) return false;
  const [a, b] = ip;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

/** Check a webhook URL. Returns an error message, or null when it's fine. */
function checkWebhookUrl(value: string): string | null {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return "That doesn't look like a web address.";
  }
  if (url.protocol !== "https:") return "The webhook URL must start with https://";
  if (isPrivateHost(url.hostname))
    return "Use a public address, local and private ones can't be reached.";
  return null;
}

/** Save the webhook URL, or turn webhooks off with an empty value. */
export async function saveWebhookUrl(
  value: string,
): Promise<DevelopersActionState> {
  const store = await ownerStore();
  if (!store) return { error: OWNER_ONLY };
  const url = value.trim();
  if (url) {
    if (url.length > 2000) return { error: "That URL is too long." };
    const problem = checkWebhookUrl(url);
    if (problem) return { error: problem };
  }
  await prisma.store.update({
    where: { id: store.id },
    data: { webhookUrl: url || null },
  });
  revalidatePath("/dashboard/developers");
  return {};
}

/** POST a sample "ping" to the saved webhook URL. */
export async function sendTestWebhook(): Promise<DevelopersActionState> {
  const store = await ownerStore();
  if (!store) return { error: OWNER_ONLY };
  const row = await prisma.store.findUnique({
    where: { id: store.id },
    select: { slug: true, apiKey: true, webhookUrl: true },
  });
  if (!row?.webhookUrl) return { error: "Save a webhook URL first." };
  const problem = checkWebhookUrl(row.webhookUrl);
  if (problem) return { error: problem };

  const result = await deliverWebhook(row.webhookUrl, row.apiKey, "ping", {
    event: "ping",
    store: row.slug,
    sentAt: new Date().toISOString(),
  });
  if (result.error) return { error: result.error };
  if (!result.ok) {
    return { error: `Your endpoint answered with status ${result.status}.` };
  }
  return { message: `Delivered. Your endpoint answered with ${result.status}.` };
}
