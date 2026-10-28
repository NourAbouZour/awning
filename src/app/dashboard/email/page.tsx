import { PageHeader } from "@/components/dashboard/page-header";
import { TalkToDeveloper } from "@/components/dashboard/talk-to-developer";

export default function EmailMarketingPage() {
  return (
    <>
      <PageHeader
        title="Email marketing"
        sub="Reach your customers' inboxes with new drops and restocks."
      />
      <TalkToDeveloper
        title="Let's set up email marketing together"
        description="Email campaigns are tailored to your store. To switch them on and plan your first send, talk to the developer directly on WhatsApp, you'll get it set up fast."
      />
    </>
  );
}
