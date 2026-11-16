"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Ban,
  CheckCircle2,
  ExternalLink,
  Search,
  Trash2,
  UserX,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  deleteMerchantStore,
  deleteMerchantAccount,
} from "@/app/admin/actions";
import { PLAN_LABELS, type Plan } from "@/lib/plan";
import type { MerchantRow } from "@/server/admin";
import { PlanRequestButtons } from "@/app/admin/plan-requests";

export function MerchantsClient({ merchants }: { merchants: MerchantRow[] }) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const [toDelete, setToDelete] = React.useState<{
    id: string;
    name: string;
    slug: string;
    owner: string;
  } | null>(null);

  const [accountToDelete, setAccountToDelete] = React.useState<{
    id: string;
    name: string;
    email: string;
    stores: string[];
  } | null>(null);

  function confirmDeleteAccount() {
    if (!accountToDelete) return;
    const target = accountToDelete;
    startTransition(async () => {
      const res = await deleteMerchantAccount(target.id);
      if (res.error) toast.error(res.error);
      else toast.success(`${target.name}'s account deleted`);
      setAccountToDelete(null);
      router.refresh();
    });
  }

  function confirmDelete() {
    if (!toDelete) return;
    const target = toDelete;
    startTransition(async () => {
      const res = await deleteMerchantStore(target.id);
      if (res.error) toast.error(res.error);
      else toast.success(`${target.name} deleted`);
      setToDelete(null);
      router.refresh();
    });
  }

  const filtered = merchants.filter(
    (m) =>
      !query ||
      `${m.name} ${m.email} ${m.stores.map((s) => `${s.name} ${s.slug}`).join(" ")}`
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
            No accounts match.
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
                    {m.isAdmin && <Badge variant="green">Your account</Badge>}
                    {!m.active && <Badge variant="amber">Suspended</Badge>}
                  </p>
                  <p className="text-xs text-ink-soft">{m.email}</p>
                  {m.stores.length === 0 ? (
                    <span className="text-xs text-ink-soft">No store yet</span>
                  ) : (
                    <ul className="mt-0.5 space-y-0.5">
                      {m.stores.map((s) => (
                        <li key={s.id} className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <Link
                            href={`/s/${s.slug}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-xs text-green hover:underline"
                          >
                            {s.name} · {s.productCount}{" "}
                            {s.productCount === 1 ? "product" : "products"}
                            <ExternalLink className="size-3" />
                          </Link>
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() =>
                              setToDelete({ ...s, owner: m.name })
                            }
                            className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded px-1 py-0.5 text-[11px] font-medium text-danger hover:bg-danger-wash"
                            aria-label={`Delete the store ${s.name}`}
                          >
                            <Trash2 className="size-3" />
                            Delete store
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {m.requestedPlan && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg bg-warn-wash px-2.5 py-2">
                      <span className="text-xs font-medium text-warn">
                        Asked for {PLAN_LABELS[m.requestedPlan]}
                      </span>
                      <PlanRequestButtons
                        userId={m.id}
                        name={m.name}
                        requested={PLAN_LABELS[m.requestedPlan]}
                      />
                    </div>
                  )}
                  {m.discountCode && (
                    <p className="mt-1">
                      <span className="inline-flex items-center gap-1 rounded-md bg-green-wash px-2 py-0.5 text-xs font-medium text-green">
                        Discount code: {m.discountCode}
                      </span>
                    </p>
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

                {/* active (never for the owner's own account) */}
                {!m.isAdmin && (
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
                )}

                {/* delete the whole account */}
                {!m.isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    className="text-danger hover:bg-danger-wash"
                    onClick={() =>
                      setAccountToDelete({
                        id: m.id,
                        name: m.name,
                        email: m.email,
                        stores: m.stores.map((s) => s.name),
                      })
                    }
                  >
                    <UserX className="size-3.5" />
                    Delete account
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Dialog
        open={!!accountToDelete}
        onOpenChange={(v) => !v && !pending && setAccountToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Delete {accountToDelete?.name}&apos;s account for good?
            </DialogTitle>
            <DialogDescription>
              This removes the login for {accountToDelete?.email}
              {accountToDelete && accountToDelete.stores.length > 0
                ? ` and ${accountToDelete.stores.length === 1 ? "their store" : "their stores"} (${accountToDelete.stores.join(", ")}) with all products, orders, customers and subscribers`
                : ""}
              . It can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAccountToDelete(null)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              className="bg-danger text-white hover:bg-danger/90"
              onClick={confirmDeleteAccount}
              disabled={pending}
            >
              <UserX className="size-3.5" />
              Delete account forever
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!toDelete} onOpenChange={(v) => !v && !pending && setToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {toDelete?.name} for good?</DialogTitle>
            <DialogDescription>
              This removes {toDelete?.owner}&apos;s storefront at shopleb.com/s/
              {toDelete?.slug} with all of its products, orders, customers and
              subscribers. It can&apos;t be undone. Their account stays, so
              they can open a new store.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setToDelete(null)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              className="bg-danger text-white hover:bg-danger/90"
              onClick={confirmDelete}
              disabled={pending}
            >
              <Trash2 className="size-3.5" />
              Delete store forever
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
