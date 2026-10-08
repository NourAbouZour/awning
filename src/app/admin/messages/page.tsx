import { listSupportRequests } from "@/server/admin";
import { AdminMessagesClient } from "./messages-client";

export default async function AdminMessagesPage() {
  const messages = await listSupportRequests();
  return <AdminMessagesClient messages={messages} />;
}
