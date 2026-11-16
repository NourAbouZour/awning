import { PageHeader } from "@/components/dashboard/page-header";
import { LockedFeature } from "@/components/dashboard/locked-feature";
import { TalkToDeveloper } from "@/components/dashboard/talk-to-developer";
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
        <TalkToDeveloper
          title="Let's connect your custom domain"
          description="Pointing your own domain to your store is handled for you. Send the developer a message on WhatsApp with the domain you want, and it'll be connected for you."
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
