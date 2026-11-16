import { PageHeader } from "@/components/dashboard/page-header";
import { LockedFeature } from "@/components/dashboard/locked-feature";
import { currentHasFeature, requireCurrentStore } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DiscountsClient, type DiscountRow } from "./discounts-client";

export default async function DiscountsPage() {
  const store = await requireCurrentStore();
  if (!(await currentHasFeature("discounts"))) {
    return (
      <>
        <PageHeader
          title="Discount codes"
          sub="Give shoppers a code to type at checkout for money off."
        />
        <LockedFeature
          feature="discounts"
          title="Run sales with discount codes"
          description="Make codes like SUMMER-10 for a percentage or a fixed amount off. Customers type the code at checkout and the price drops right away."
        />
      </>
    );
  }

  const rows = await prisma.discount.findMany({
    where: { storeId: store.id },
    orderBy: { createdAt: "desc" },
  });

  const discounts: DiscountRow[] = rows.map((d) => ({
    id: d.id,
    code: d.code,
    kind: d.kind === "fixed" ? "fixed" : "percent",
    value: Number(d.value.toString()),
    minTotal: d.minTotal ? Number(d.minTotal.toString()) : null,
    active: d.active,
    uses: d.uses,
  }));

  return <DiscountsClient discounts={discounts} currency={store.currency} />;
}
