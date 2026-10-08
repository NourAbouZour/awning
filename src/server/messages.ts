import { prisma } from "@/lib/db";
import { toMessage } from "@/server/adapters";
import type { ContactMessage } from "@/lib/types";

export async function listMessages(storeId: string): Promise<ContactMessage[]> {
  const rows = await prisma.contactMessage.findMany({
    where: { storeId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toMessage);
}
