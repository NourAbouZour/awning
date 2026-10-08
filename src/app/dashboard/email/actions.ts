"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireCurrentStore } from "@/lib/auth";
import { sendCampaignEmail } from "@/lib/mailer";
import { listSubscribers } from "@/server/email";

export async function sendCampaign(
  subject: string,
  body: string,
): Promise<{ error?: string; sent?: number }> {
  const store = await requireCurrentStore();
  if (subject.trim().length < 2) return { error: "Add a subject line." };
  if (body.trim().length < 5) return { error: "Write a message to send." };

  const emails = (await listSubscribers(store.id)).map((s) => s.email);
  if (emails.length === 0) {
    return { error: "You have no subscribers yet." };
  }

  try {
    await sendCampaignEmail(emails, subject.trim(), body.trim(), store.name);
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Couldn't send the campaign.",
    };
  }

  await prisma.campaign.create({
    data: {
      storeId: store.id,
      subject: subject.trim(),
      body: body.trim(),
      recipients: emails.length,
    },
  });
  revalidatePath("/dashboard/email");
  return { sent: emails.length };
}
