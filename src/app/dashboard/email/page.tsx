import { requireCurrentStore } from "@/lib/auth";
import { listSubscribers, listCampaigns } from "@/server/email";
import { isMailConfigured } from "@/lib/mailer";
import { EmailClient } from "./email-client";

export default async function EmailMarketingPage() {
  const store = await requireCurrentStore();
  const [subscribers, campaigns] = await Promise.all([
    listSubscribers(store.id),
    listCampaigns(store.id),
  ]);
  return (
    <EmailClient
      subscribers={subscribers}
      campaigns={campaigns}
      mailConfigured={isMailConfigured()}
    />
  );
}
