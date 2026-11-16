"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, KeyRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  dismissPasswordReset,
  generateResetCode,
} from "@/app/admin/actions";
import { normalizePhone } from "@/lib/product";
import type { PasswordResetRow } from "@/server/admin";
import { formatDateTime } from "@/lib/utils";

/** Minutes and seconds left until an ISO time, or null once it has passed. */
function useCountdown(until: string | null) {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    if (!until) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [until]);
  if (!until) return null;
  const left = Math.max(0, Math.floor((new Date(until).getTime() - now) / 1000));
  if (left === 0) return null;
  return `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
}

function ResetRow({ request }: { request: PasswordResetRow }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  // The code itself is only known right after it is generated.
  const [fresh, setFresh] = React.useState<{ code: string; expiresAt: string } | null>(null);
  const freshLeft = useCountdown(fresh?.expiresAt ?? null);
  const earlierLeft = useCountdown(fresh ? null : request.codeExpiresAt);

  function generate() {
    startTransition(async () => {
      const res = await generateResetCode(request.id);
      if (res.error || !res.code || !res.expiresAt) {
        toast.error(res.error ?? "Couldn't make a code.");
        router.refresh();
        return;
      }
      setFresh({ code: res.code, expiresAt: res.expiresAt });
    });
  }

  function dismiss() {
    startTransition(async () => {
      await dismissPasswordReset(request.id);
      toast.success("Request closed");
      router.refresh();
    });
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied");
    } catch {
      toast.error("Couldn't copy, type it out instead.");
    }
  }

  const live = fresh && freshLeft;
  const message = live
    ? `Your Shopleb code is ${fresh.code}. It works once, for 5 minutes. Open shopleb.com/login, press "Forgot it?", then "I have my code".`
    : "";
  const whatsapp =
    live && request.storePhone
      ? `https://wa.me/${normalizePhone(request.storePhone)}?text=${encodeURIComponent(message)}`
      : null;

  if (!request.hasAccount) {
    return (
      <li className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink">
            {request.email}{" "}
            <span className="font-normal text-ink-soft">
              asked for a password code
            </span>
          </p>
          <p className="text-xs text-warn">
            No account uses this email. They may have signed up with a
            different one, so there is no code to make.
          </p>
          <p className="text-xs text-ink-soft">
            Asked {formatDateTime(request.requestedAt)}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={dismiss}
          aria-label={`Close the request from ${request.email}`}
        >
          <X className="size-3.5" />
          Close
        </Button>
      </li>
    );
  }

  return (
    <li className="px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink">
            {request.name}{" "}
            <span className="font-normal text-ink-soft">
              forgot their password
            </span>
          </p>
          <p className="text-xs text-ink-soft">
            {request.email}
            {request.storeName ? ` · ${request.storeName}` : ""}
            {request.role === "staff"
              ? " (staff)"
              : request.role === "superadmin"
                ? " · Shopleb admin account"
                : ""}
            {request.storePhone ? ` · ${request.storePhone}` : ""} · asked{" "}
            {formatDateTime(request.requestedAt)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" disabled={pending} onClick={generate}>
            <KeyRound className="size-3.5" />
            {fresh || request.codeExpiresAt ? "New code" : "Generate code"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={dismiss}
            aria-label={`Close ${request.name}'s request`}
          >
            <X className="size-3.5" />
            Close
          </Button>
        </div>
      </div>

      {live && (
        <div className="mt-3 rounded-lg border border-green/25 bg-green-wash p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p
              className="font-display text-3xl font-bold tracking-[0.25em] text-green"
              aria-label={`One-time code ${fresh.code.split("").join(" ")}`}
            >
              {fresh.code}
            </p>
            <p className="text-sm font-medium text-green" aria-live="off">
              Works for {freshLeft}
            </p>
          </div>
          <p className="mt-1 text-xs text-ink-body">
            Give this code to {request.name} now. It works once. You won&apos;t
            see it again after you leave this page.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => copy(fresh.code)}>
              <Copy className="size-3.5" />
              Copy code
            </Button>
            <Button variant="outline" size="sm" onClick={() => copy(message)}>
              <Copy className="size-3.5" />
              Copy message
            </Button>
            {whatsapp && (
              <Button variant="outline" size="sm" asChild>
                <a href={whatsapp} target="_blank" rel="noreferrer">
                  Send on WhatsApp
                </a>
              </Button>
            )}
          </div>
        </div>
      )}
      {fresh && !freshLeft && (
        <p className="mt-2 text-xs text-warn">
          That code has expired. Generate a new one if they still need it.
        </p>
      )}
      {!fresh && earlierLeft && (
        <p className="mt-2 text-xs text-ink-soft">
          A code you made earlier still works for {earlierLeft}. Generating a
          new one replaces it.
        </p>
      )}
    </li>
  );
}

/** Forgot-password requests waiting for a one-time code, for the admin overview. */
export function PasswordResets({ requests }: { requests: PasswordResetRow[] }) {
  if (requests.length === 0) {
    return (
      <p className="px-5 py-8 text-center text-sm text-ink-soft">
        No one is waiting. When someone presses &quot;Forgot it?&quot; on the
        login page, their request shows up here.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-line">
      {requests.map((r) => (
        <ResetRow key={r.id} request={r} />
      ))}
    </ul>
  );
}
