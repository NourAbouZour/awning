"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  approvePlanRequest,
  declinePlanRequest,
} from "@/app/admin/actions";
import { PLAN_LABELS } from "@/lib/plan";
import type { PlanRequestRow } from "@/server/admin";
import { formatDateTime } from "@/lib/utils";

/** Approve / decline buttons for one merchant's plan request. */
export function PlanRequestButtons({
  userId,
  name,
  requested,
}: {
  userId: string;
  name: string;
  requested: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function run(action: () => Promise<void>, message: string) {
    startTransition(async () => {
      await action();
      toast.success(message);
      router.refresh();
    });
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        disabled={pending}
        onClick={() =>
          run(
            () => approvePlanRequest(userId),
            `${name} is now on ${requested}`,
          )
        }
      >
        <Check className="size-3.5" />
        Approve
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() =>
          run(() => declinePlanRequest(userId), `${name}'s request declined`)
        }
      >
        <X className="size-3.5" />
        Decline
      </Button>
    </div>
  );
}

/** The list of merchants waiting for a plan change, for the admin overview. */
export function PlanRequests({ requests }: { requests: PlanRequestRow[] }) {
  if (requests.length === 0) {
    return (
      <p className="px-5 py-8 text-center text-sm text-ink-soft">
        No plan requests right now. When a merchant picks a paid plan in their
        Settings, it shows up here for you to approve.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-line">
      {requests.map((r) => (
        <li
          key={r.userId}
          className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink">
              {r.name}{" "}
              <span className="font-normal text-ink-soft">
                wants {PLAN_LABELS[r.requestedPlan]}
              </span>
            </p>
            <p className="text-xs text-ink-soft">
              {r.email} · now on {PLAN_LABELS[r.currentPlan]} · asked{" "}
              {formatDateTime(r.requestedAt)}
            </p>
            {r.storeSlug && (
              <Link
                href={`/s/${r.storeSlug}`}
                target="_blank"
                className="mt-0.5 inline-flex items-center gap-1 text-xs text-green hover:underline"
              >
                {r.storeName}
                <ExternalLink className="size-3" />
              </Link>
            )}
          </div>
          <PlanRequestButtons
            userId={r.userId}
            name={r.name}
            requested={PLAN_LABELS[r.requestedPlan]}
          />
        </li>
      ))}
    </ul>
  );
}
