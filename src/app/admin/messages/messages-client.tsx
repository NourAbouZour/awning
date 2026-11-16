"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Inbox, Trash2, Undo2 } from "lucide-react";
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
import { EmptyState } from "@/components/ui/empty-state";
import {
  deleteHandledSupportRequests,
  deleteSupportRequest,
  markSupportHandled,
} from "@/app/admin/actions";
import type { SupportRow } from "@/server/admin";
import { formatDateTime } from "@/lib/utils";

export function AdminMessagesClient({
  messages,
  top,
}: {
  messages: SupportRow[];
  /** Shown between the page title and the list of enquiries. */
  top?: React.ReactNode;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  // What the confirm dialog is about to delete: one message, or all handled.
  const [toDelete, setToDelete] = React.useState<SupportRow | "handled" | null>(
    null,
  );
  const handledCount = messages.filter((m) => m.handled).length;

  function confirmDelete() {
    const target = toDelete;
    if (!target) return;
    startTransition(async () => {
      if (target === "handled") {
        const n = await deleteHandledSupportRequests();
        toast.success(`${n} ${n === 1 ? "message" : "messages"} deleted`);
      } else {
        await deleteSupportRequest(target.id);
        toast.success("Message deleted");
      }
      setToDelete(null);
      router.refresh();
    });
  }

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
        sub="Forgot-password requests, messages from the Contact us and pricing pages, and requests and ideas from shop owners."
      />
      {top}

      {handledCount > 0 && (
        <div className="mb-3 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            className="text-danger hover:bg-danger-wash"
            onClick={() => setToDelete("handled")}
          >
            <Trash2 className="size-3.5" />
            Delete all handled ({handledCount})
          </Button>
        </div>
      )}

      {messages.length === 0 ? (
        <EmptyState
          icon={<Inbox />}
          title="No messages yet"
          description="Messages from the Contact us page, the pricing page, and shop owners writing from their dashboard land here."
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
                  <div className="flex gap-2">
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
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    className="text-danger hover:bg-danger-wash"
                    onClick={() => setToDelete(m)}
                    aria-label={`Delete the message from ${m.name}`}
                  >
                    <Trash2 className="size-3.5" />
                    Delete
                  </Button>
                  </div>
                </div>
                <p className="mt-3 max-w-prose whitespace-pre-wrap text-sm leading-relaxed text-ink-body">
                  {m.message}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Dialog
        open={!!toDelete}
        onOpenChange={(v) => !v && !pending && setToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {toDelete === "handled"
                ? `Delete ${handledCount} handled ${handledCount === 1 ? "message" : "messages"}?`
                : "Delete this message?"}
            </DialogTitle>
            <DialogDescription>
              {toDelete === "handled"
                ? "Every message you marked as handled is removed for good."
                : toDelete
                  ? `The message from ${toDelete.name} is removed for good.`
                  : ""}
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
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
