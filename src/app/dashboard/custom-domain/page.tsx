import { PageHeader } from "@/components/dashboard/page-header";
import { LockedFeature } from "@/components/dashboard/locked-feature";
import { MessageShoplebForm } from "@/components/dashboard/message-shopleb-form";
import { currentHasFeature } from "@/lib/auth";

export default async function CustomDomainPage() {
  const unlocked = await currentHasFeature("customDomain");
  return (
    <>
      <PageHeader
        title="Custom domain"
        sub="Use your own domain name instead of your free shopleb.com/s/ address."
      />
      {unlocked ? (
        <MessageShoplebForm
          topics={[{ id: "domain", label: "Custom domain" }]}
          title="Message the developer"
          description="Connecting your own domain is done for you. Tell us the domain you want (or already own) and we'll set it up and let you know when it's live."
          label="Your domain and any details"
          placeholder="e.g. I own honeycomb.com and want my store to open there."
          sendLabel="Message the developer"
        />
      ) : (
        <LockedFeature
          feature="customDomain"
          title="Use your own domain name"
          description="Have your store open at yourbrand.com instead of the free shopleb.com/s/ address. We connect it for you."
        />
      )}
    </>
  );
}
