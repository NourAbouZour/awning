import { requireCurrentStore } from "@/lib/auth";
import { listMessages } from "@/server/messages";
import { MessagesClient } from "./messages-client";

export default async function MessagesPage() {
  const store = await requireCurrentStore();
  const messages = await listMessages(store.id);
  return <MessagesClient initial={messages} />;
}
