import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { adminStats, listSupportRequests } from "@/server/admin";
import { PLAN_LABELS } from "@/lib/plan";
import { formatDateTime } from "@/lib/utils";

export default async function AdminOverview() {
  const [stats, support] = await Promise.all([
    adminStats(),
    listSupportRequests(),
  ]);
  const recent = support.slice(0, 5);

  const tiles = [
    { label: "Merchants", value: String(stats.merchants) },
    { label: "Paid", value: String(stats.paid) },
    { label: "Unpaid", value: String(stats.unpaid) },
    { label: "Suspended", value: String(stats.suspended) },
  ];

  return (
    <>
      <PageHeader title="Overview" sub="Your platform at a glance." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((t) => (
          <Card key={t.label} className="p-5">
            <p className="text-[13px] text-ink-soft">{t.label}</p>
            <p className="mt-1.5 font-display text-[26px] font-bold tracking-tight text-ink">
              {t.value}
            </p>
          </Card>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.4fr]">
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-ink">Plans</h2>
          <ul className="mt-4 space-y-2.5">
            {(["stall", "shopfront", "arcade"] as const).map((p) => (
              <li
                key={p}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-ink-body">{PLAN_LABELS[p]}</span>
                <span className="font-semibold text-ink">
                  {stats.byPlan[p]}
                </span>
              </li>
            ))}
          </ul>
          <Button variant="outline" size="sm" className="mt-5 w-full" asChild>
            <Link href="/admin/merchants">
              Manage merchants
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </Card>

        <Card>
          <div className="flex items-center justify-between px-5 pt-5">
            <h2 className="text-sm font-semibold text-ink">
              Recent messages
              {stats.unhandledSupport > 0 && (
                <span className="ml-2 rounded-full bg-green px-2 py-0.5 text-[11px] font-semibold text-white">
                  {stats.unhandledSupport} new
                </span>
              )}
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/messages">
                All
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
          <div className="mt-2 divide-y divide-line">
            {recent.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-ink-soft">
                No messages yet.
              </p>
            ) : (
              recent.map((m) => (
                <div key={m.id} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-medium text-ink">
                      {m.subject}
                    </span>
                    <span className="shrink-0 text-xs text-ink-soft">
                      {formatDateTime(m.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-ink-soft">
                    {m.name} · {m.email}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
