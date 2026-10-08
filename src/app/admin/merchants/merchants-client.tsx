"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Ban, CheckCircle2, ExternalLink, Search } from "lucide-react";
import { Card, PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  setMerchantPlan,
  setBillingPaid,
  setAccountActive,
} from "@/app/admin/actions";
import { PLAN_LABELS, type Plan } from "@/lib/plan";
import type { MerchantRow } from "@/server/admin";

export function MerchantsClient({ merchants }: { merchants: MerchantRow[] }) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  const filtered = merchants.filter(
    (m) =>
      !query ||
      `${m.name} ${m.email} ${m.storeName ?? ""}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );

  function run(action: () => Promise<void>, message: string) {
    startTransition(async () => {
      await action();
      toast.success(message);
      router.refresh();
    });
  }

  return (
    <>
      <PageHeader
        title="Merchants"
        sub={`${merchants.length} ${merchants.length === 1 ? "account" : "accounts"}`}
      />

      <Card>
        <div className="border-b border-line p-4">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, or store"
              className="h-9 pl-9"
              aria-label="Search merchants"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="p-8 text-center text-sm text-ink-soft">
            No merchants match.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {filtered.map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-center gap-4 px-4 py-4"
              >
                <div className="min-w-48 flex-1">
                  <p className="flex items-center gap-2 text-sm font-medium text-ink">
                    {m.name}
                    {!m.active && <Badge variant="amber">Suspended</Badge>}
                  </p>
                  <p className="text-xs text-ink-soft">{m.email}</p>
                  {m.storeSlug ? (
                    <Link
                      href={`/s/${m.storeSlug}`}
                      target="_blank"
                      className="mt-0.5 inline-flex items-center gap-1 text-xs text-green hover:underline"
                    >
                      {m.storeName} · {m.productCount}{" "}
                      {m.productCount === 1 ? "product" : "products"}
                      <ExternalLink className="size-3" />
                    </Link>
                  ) : (
                    <span className="text-xs text-ink-soft">
                      No store yet
                    </span>
                  )}
                </div>

                {/* plan */}
                <div className="w-36">
                  <Select
                    value={m.plan}
                    onValueChange={(v) =>
                      run(
                        () => setMerchantPlan(m.id, v as Plan),
                        `${m.name} set to ${PLAN_LABELS[v as Plan]}`,
                      )
                    }
                  >
                    <SelectTrigger
                      className="h-9"
                      aria-label={`Plan for ${m.name}`}
                      disabled={pending}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["stall", "shopfront", "arcade"] as const).map((p) => (
                        <SelectItem key={p} value={p}>
                          {PLAN_LABELS[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* paid */}
                <Button
                  variant={m.billingPaid ? "outline" : "primary"}
                  size="sm"
                  disabled={pending}
                  className="w-28"
                  onClick={() =>
                    run(
                      () => setBillingPaid(m.id, !m.billingPaid),
                      m.billingPaid
                        ? `${m.name} marked unpaid`
                        : `${m.name} marked paid`,
                    )
                  }
                >
                  {m.billingPaid ? "Paid ✓" : "Mark paid"}
                </Button>

                {/* active */}
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  className={
                    m.active
                      ? "w-28 text-danger hover:bg-danger-wash"
                      : "w-28 text-ok hover:bg-ok-wash"
                  }
                  onClick={() =>
                    run(
                      () => setAccountActive(m.id, !m.active),
                      m.active
                        ? `${m.name} suspended`
                        : `${m.name} reactivated`,
                    )
                  }
                >
                  {m.active ? (
                    <>
                      <Ban className="size-3.5" />
                      Suspend
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-3.5" />
                      Reactivate
                    </>
                  )}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
