"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser, requireCurrentStore } from "@/lib/auth";

export type MessageTopic = "domain" | "idea" | "help";

const TOPIC_LABEL: Record<MessageTopic, string> = {
  domain: "Custom domain request",
  idea: "Idea or improvement",
  help: "Help needed",
};

/**
 * A shop owner (or their staff) writes to the Shopleb team from inside the
 * dashboard. The message lands in the superadmin's Messages page, tagged
 * with the store it came from.
 */
export async function messageShopleb(
  topic: MessageTopic,
  message: string,
): Promise<{ error?: string }> {
  const [user, store] = await Promise.all([
    getCurrentUser(),
    requireCurrentStore(),
  ]);
  if (!user) return { error: "Please log in again." };
  const body = message.trim();
  if (body.length < 5)
    return { error: "Write a few words so we know how to help." };
  if (body.length > 4000)
    return { error: "That's a bit long. Keep it under 4,000 characters." };
  if (!(topic in TOPIC_LABEL)) return { error: "Unknown topic." };

  await prisma.supportRequest.create({
    data: {
      name: user.name,
      email: user.email,
      subject: `${TOPIC_LABEL[topic]} · ${store.name} (shopleb.com/s/${store.slug})`,
      message: body,
    },
  });
  revalidatePath("/admin", "layout");
  return {};
}
