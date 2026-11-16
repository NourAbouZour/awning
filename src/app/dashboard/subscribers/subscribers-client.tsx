"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, Download, Mail, Search, Trash2 } from "lucide-react";
import { Card, PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { removeSubscriber } from "@/app/dashboard/subscribers/actions";
import type { SubscriberRow } from "@/server/email";
import { formatDateTime } from "@/lib/utils";

export function SubscribersClient({
  subscribers,
  storeSlug,
}: {
  subscribers: SubscriberRow[];
  storeSlug: string;
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  const filtered = subscribers.filter(
    (s) => !query || s.email.toLowerCase().includes(query.toLowerCase()),
  );

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(
        subscribers.map((s) => s.email).join(", "),
      );
      toast.success(
        `${subscribers.length} ${subscribers.length === 1 ? "email" : "emails"} copied`,
      );
    } catch {
      toast.error("Couldn't copy. Download the list instead.");
    }
  }

  function download() {
    const rows = [
      "email,joined",
      ...subscribers.map((s) => `${s.email},${s.createdAt}`),
    ];
    const url = URL.createObjectURL(
      new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `${storeSlug}-newsletter.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function remove(s: SubscriberRow) {
    startTransition(async () => {
      const res = await removeSubscriber(s.id);
      if (res.error) toast.error(res.error);
      else {
        toast.success(`${s.email} removed`);
        router.refresh();
      }
    });
  }

  return (
    <>
      <PageHeader
        title="Newsletter"
        sub={`${subscribers.length} ${subscribers.length === 1 ? "person has" : "people have"} joined your list from your store.`}
        actions={
          subscribers.length > 0 ? (
            <>
              <Button variant="outline" size="sm" onClick={copyAll}>
                <Copy className="size-3.5" />
                Copy emails
              </Button>
              <Button variant="outline" size="sm" onClick={download}>
                <Download className="size-3.5" />
                Download CSV
              </Button>
            </>
          ) : undefined
        }
      />

      {subscribers.length === 0 ? (
        <EmptyState
          icon={<Mail />}
          title="No one has joined yet"
          description="When a shopper types their email in the newsletter box on your store (in the footer or the newsletter section), it shows up here."
        />
      ) : (
        <Card>
          <div className="border-b border-line p-4">
            <div className="relative max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search emails"
                className="h-9 pl-9"
                aria-label="Search subscribers"
              />
            </div>
          </div>
          {filtered.length === 0 ? (
            <p className="p-8 text-center text-sm text-ink-soft">
              No email matches.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {filtered.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <a
                      href={`mailto:${s.email}`}
                      className="block truncate text-sm font-medium text-ink hover:underline"
                    >
                      {s.email}
                    </a>
                    <p className="text-xs text-ink-soft">
                      Joined {formatDateTime(s.createdAt)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={pending}
                    aria-label={`Remove ${s.email}`}
                    onClick={() => remove(s)}
                  >
                    <Trash2 className="size-3.5 text-ink-soft" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-line px-4 py-3 text-xs text-ink-soft">
            To email everyone at once, use{" "}
            <Link
              href="/dashboard/email"
              className="font-medium text-green underline-offset-4 hover:underline"
            >
              Email marketing
            </Link>
            .
          </div>
        </Card>
      )}
    </>
  );
}
