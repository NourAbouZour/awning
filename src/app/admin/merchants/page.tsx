import { listMerchants } from "@/server/admin";
import { MerchantsClient } from "./merchants-client";

export default async function MerchantsPage() {
  const merchants = await listMerchants();
  return <MerchantsClient merchants={merchants} />;
}
