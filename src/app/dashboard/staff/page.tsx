import { UserCog } from "lucide-react";
import { Card, PageHeader } from "@/components/dashboard/page-header";
import { LockedFeature } from "@/components/dashboard/locked-feature";
import { currentHasFeature, isStoreOwner, requireCurrentStore } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { StaffClient, type StaffMember } from "./staff-client";

const SUB = "Give your team their own login to help run the shop.";

export default async function StaffPage() {
  const store = await requireCurrentStore();

  if (!(await currentHasFeature("staff"))) {
    return (
      <>
        <PageHeader title="Staff" sub={SUB} />
        <LockedFeature
          feature="staff"
          title="Run the shop as a team"
          description="Add staff with their own email and password. They can handle products, orders and customers while you keep control of the plan and settings."
        />
      </>
    );
  }

  if (!(await isStoreOwner())) {
    return (
      <>
        <PageHeader title="Staff" sub={SUB} />
        <Card className="mx-auto max-w-xl p-8 text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-green-wash">
            <UserCog className="size-6 text-green" />
          </span>
          <h2 className="mt-5 text-lg font-semibold text-ink">
            Only the store owner can manage staff
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-body">
            Ask the owner of {store.name} if you need someone added or removed.
          </p>
        </Card>
      </>
    );
  }

  const rows = await prisma.user.findMany({
    where: { role: "staff", staffStoreId: store.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, active: true, createdAt: true },
  });
  const staff: StaffMember[] = rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));

  return <StaffClient staff={staff} storeName={store.name} />;
}
