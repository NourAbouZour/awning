"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Inbox, Send } from "lucide-react";
import { Card, PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Textarea } from "@/components/ui/textarea";
import { markMessageRead } from "@/app/dashboard/messages/actions";
import type { ContactMessage } from "@/lib/types";
import { cn, formatDateTime } from "@/lib/utils";

export function MessagesClient({ initial }: { initial: ContactMessage[] }) {
  const router = useRouter();
  const [messages, setMessages] = React.useState<ContactMessage[]>(initial);
  const [activeId, setActiveId] = React.useState<string | null>(
    initial[0]?.id ?? null,
  );
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [reply, setReply] = React.useState("");

  const active = messages.find((m) => m.id === activeId);

  function openMessage(id: string) {
    setActiveId(id);
    setMobileOpen(true);
    setReply("");
    const wasUnread = messages.find((m) => m.id === id && !m.read);
    setMessages((ms) => ms.map((m) => (m.id === id ? { ...m, read: true } : m)));
    if (wasUnread) {
      React.startTransition(async () => {
        await markMessageRead(id);
        router.refresh();
      });
    }
  }

  function sendReply() {
    if (!reply.trim() || !active) return;
    // No email backend in this phase — hand off to the merchant's mail client.
    const subject = encodeURIComponent(`Re: ${active.subject}`);
    const body = encodeURIComponent(reply);
    window.location.href = `mailto:${active.email}?subject=${subject}&body=${body}`;
    setReply("");
  }

  const unread = messages.filter((m) => !m.read).length;

  return (
    <>
      <PageHeader
        title="Messages"
        sub={
          unread
            ? `${unread} unread from your storefront contact page`
            : "You're all caught up"
        }
      />

      {messages.length === 0 ? (
        <EmptyState
          icon={<Inbox />}
          title="No messages yet"
          description="When someone writes to you from your storefront's contact page, it lands here."
        />
      ) : (
        <Card className="grid min-h-[32rem] overflow-hidden lg:grid-cols-[1fr_1.6fr]">
          <ul
            className={cn(
              "divide-y divide-line border-line lg:border-r",
              mobileOpen && "hidden lg:block",
            )}
          >
            {messages.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => openMessage(m.id)}
                  aria-current={m.id === activeId ? "true" : undefined}
                  className={cn(
                    "flex w-full flex-col gap-1 px-4 py-3.5 text-left transition-colors",
                    m.id === activeId ? "bg-green-wash/50" : "hover:bg-canvas/70",
                  )}
                >
                  <span className="flex items-center gap-2">
                    {!m.read && (
                      <span
                        className="size-2 shrink-0 rounded-full bg-green"
                        aria-label="Unread"
                      />
                    )}
                    <span
                      className={cn(
                        "truncate text-sm",
                        m.read
                          ? "font-medium text-ink-body"
                          : "font-semibold text-ink",
                      )}
                    >
                      {m.name}
                    </span>
                    <span className="ml-auto shrink-0 text-[11px] text-ink-soft">
                      {formatDateTime(m.createdAt)}
                    </span>
                  </span>
                  <span className="truncate text-[13px] text-ink-body">
                    {m.subject}
                  </span>
                  <span className="truncate text-xs text-ink-soft">
                    {m.body}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <div className={cn("flex flex-col", !mobileOpen && "hidden lg:flex")}>
            {active ? (
              <>
                <div className="border-b border-line p-5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-2 mb-3 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                  >
                    <ArrowLeft className="size-3.5" />
                    Inbox
                  </Button>
                  <h2 className="font-display text-lg font-semibold text-ink">
                    {active.subject}
                  </h2>
                  <p className="mt-1 text-sm text-ink-soft">
                    {active.name} ·{" "}
                    <a href={`mailto:${active.email}`} className="hover:underline">
                      {active.email}
                    </a>{" "}
                    · {formatDateTime(active.createdAt)}
                  </p>
                </div>
                <div className="flex-1 p-5">
                  <p className="max-w-prose text-sm leading-relaxed text-ink-body">
                    {active.body}
                  </p>
                </div>
                <div className="border-t border-line p-4">
                  <label htmlFor="reply" className="sr-only">
                    Reply to {active.name}
                  </label>
                  <Textarea
                    id="reply"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder={`Reply to ${active.name}…`}
                    className="min-h-20"
                  />
                  <div className="mt-2.5 flex justify-end">
                    <Button size="sm" onClick={sendReply} disabled={!reply.trim()}>
                      <Send className="size-3.5" />
                      Send reply
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center p-6 text-sm text-ink-soft">
                Select a message to read it
              </div>
            )}
          </div>
        </Card>
      )}
    </>
  );
}
