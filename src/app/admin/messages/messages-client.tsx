"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Inbox, Undo2 } from "lucide-react";
import { Card, PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { markSupportHandled } from "@/app/admin/actions";
import type { SupportRow } from "@/server/admin";
import { formatDateTime } from "@/lib/utils";

export function AdminMessagesClient({ messages }: { messages: SupportRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function toggle(m: SupportRow) {
    startTransition(async () => {
      await markSupportHandled(m.id, !m.handled);
      toast.success(m.handled ? "Marked as new" : "Marked handled");
      router.refresh();
    });
  }

  return (
    <>
      <PageHeader
        title="Messages"
        sub="Enquiries from the pricing page contact form."
      />

      {messages.length === 0 ? (
        <EmptyState
          icon={<Inbox />}
          title="No messages yet"
          description="When someone fills in the contact form on your pricing page, it lands here."
        />
      ) : (
        <Card>
          <ul className="divide-y divide-line">
            {messages.map((m) => (
              <li key={m.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                      {m.subject}
                      {!m.handled && <Badge variant="green">New</Badge>}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-soft">
                      {m.name} ·{" "}
                      <a
                        href={`mailto:${m.email}`}
                        className="text-green hover:underline"
                      >
                        {m.email}
                      </a>{" "}
                      · {formatDateTime(m.createdAt)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pending}
                    onClick={() => toggle(m)}
                  >
                    {m.handled ? (
                      <>
                        <Undo2 className="size-3.5" />
                        Mark new
                      </>
                    ) : (
                      <>
                        <Check className="size-3.5" />
                        Mark handled
                      </>
                    )}
                  </Button>
                </div>
                <p className="mt-3 max-w-prose whitespace-pre-wrap text-sm leading-relaxed text-ink-body">
                  {m.message}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
