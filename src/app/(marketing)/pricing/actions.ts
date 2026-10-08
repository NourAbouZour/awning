"use server";

import { prisma } from "@/lib/db";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface SupportInput {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export async function submitSupportRequest(
  input: SupportInput,
): Promise<{ error?: string }> {
  if (input.name.trim().length < 2) return { error: "Tell us your name." };
  if (!EMAIL_RE.test(input.email))
    return { error: "That doesn't look like an email address." };
  if (!input.subject.trim()) return { error: "Add a subject." };
  if (input.message.trim().length < 10)
    return { error: "Give us a little more to go on — 10+ characters." };

  await prisma.supportRequest.create({
    data: {
      name: input.name.trim(),
      email: input.email.trim(),
      subject: input.subject.trim(),
      message: input.message.trim(),
    },
  });
  return {};
}
