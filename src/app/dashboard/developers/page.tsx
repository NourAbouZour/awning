import { Card, PageHeader } from "@/components/dashboard/page-header";
import { LockedFeature } from "@/components/dashboard/locked-feature";
import { currentHasFeature, isStoreOwner, requireCurrentStore } from "@/lib/auth";
import { DevelopersClient } from "./developers-client";

const SUB = "Connect your store to other apps with a read-only API and order webhooks.";

export default async function DevelopersPage() {
  const store = await requireCurrentStore();
  const unlocked = await currentHasFeature("api");

  if (!unlocked) {
    return (
      <>
        <PageHeader title="API & webhooks" sub={SUB} />
        <LockedFeature
          feature="api"
          title="Connect your store to other apps"
          description="Read your products and orders from your own tools with an API key, and get a webhook call the moment an order comes in or changes."
        />
      </>
    );
  }

  if (!(await isStoreOwner())) {
    return (
      <>
        <PageHeader title="API & webhooks" sub={SUB} />
        <Card className="mx-auto max-w-xl p-8 text-center">
          <h2 className="text-lg font-semibold text-ink">
            Only the store owner can manage API access
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-body">
            Ask the owner of {store.name} if you need an API key or a webhook
            set up.
          </p>
        </Card>
      </>
    );
  }

  return (
    <DevelopersClient
      storeSlug={store.slug}
      apiKey={store.apiKey ?? null}
      webhookUrl={store.webhookUrl ?? ""}
    />
  );
}
