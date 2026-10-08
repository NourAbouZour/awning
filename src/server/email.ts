import { prisma } from "@/lib/db";

export interface SubscriberRow {
  id: string;
  email: string;
  createdAt: string;
}

export interface CampaignRow {
  id: string;
  subject: string;
  body: string;
  recipients: number;
  sentAt: string;
}

export async function listSubscribers(
  storeId: string,
): Promise<SubscriberRow[]> {
  const rows = await prisma.subscriber.findMany({
    where: { storeId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function subscriberCount(storeId: string): Promise<number> {
  return prisma.subscriber.count({ where: { storeId } });
}

export async function listCampaigns(storeId: string): Promise<CampaignRow[]> {
  const rows = await prisma.campaign.findMany({
    where: { storeId },
    orderBy: { sentAt: "desc" },
  });
  return rows.map((r) => ({
    id: r.id,
    subject: r.subject,
    body: r.body,
    recipients: r.recipients,
    sentAt: r.sentAt.toISOString(),
  }));
}
