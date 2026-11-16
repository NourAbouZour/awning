import { PageHeader } from "@/components/dashboard/page-header";
import { LockedFeature } from "@/components/dashboard/locked-feature";
import { requireCurrentStore, currentHasFeature } from "@/lib/auth";
import { isMailConfigured } from "@/lib/mailer";
import { listCampaigns, listSubscribers } from "@/server/email";
import { EmailClient } from "./email-client";

export default async function EmailMarketingPage() {
  const store = await requireCurrentStore();
  if (!(await currentHasFeature("emailMarketing"))) {
    return (
      <>
        <PageHeader
          title="Email marketing"
          sub="Reach your customers' inboxes with new drops and restocks."
        />
        <LockedFeature
          feature="emailMarketing"
          title="Send emails to your subscribers"
          description="Everyone who joins your newsletter on the storefront lands here. Write a campaign and send it to all of them in one go."
        />
      </>
    );
  }
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
