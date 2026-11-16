import { requireCurrentStore } from "@/lib/auth";
import { listSubscribers } from "@/server/email";
import { SubscribersClient } from "./subscribers-client";

export default async function SubscribersPage() {
  const store = await requireCurrentStore();
  const subscribers = await listSubscribers(store.id);
  return <SubscribersClient subscribers={subscribers} storeSlug={store.slug} />;
}
