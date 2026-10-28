import { PageHeader } from "@/components/dashboard/page-header";
import { TalkToDeveloper } from "@/components/dashboard/talk-to-developer";

export default function CustomDomainPage() {
  return (
    <>
      <PageHeader
        title="Custom domain"
        sub="Use your own domain name instead of your free shopleb.shop address."
      />
      <TalkToDeveloper
        title="Let's connect your custom domain"
        description="Pointing your own domain to your store is handled for you. Send the developer a message on WhatsApp with the domain you want, and it'll be connected for you."
      />
    </>
  );
}
