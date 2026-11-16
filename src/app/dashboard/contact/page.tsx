import { PageHeader } from "@/components/dashboard/page-header";
import { MessageShoplebForm } from "@/components/dashboard/message-shopleb-form";

export default function ContactShoplebPage() {
  return (
    <>
      <PageHeader
        title="Contact Shopleb"
        sub="Tell us what would make Shopleb better for your shop, or ask for a hand."
      />
      <MessageShoplebForm
        topics={[
          { id: "idea", label: "An idea or improvement" },
          { id: "help", label: "I need help" },
        ]}
        title="Write to the Shopleb team"
        description="Missing a feature, found something confusing, or stuck on a step? Write it here. It goes straight to the people who build Shopleb."
        placeholder="e.g. It would help if I could print a packing slip for each order."
      />
    </>
  );
}
