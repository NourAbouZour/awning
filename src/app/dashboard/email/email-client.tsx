"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Mail, Send, Users } from "lucide-react";
import { Card, PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
import { sendCampaign } from "@/app/dashboard/email/actions";
import type { SubscriberRow, CampaignRow } from "@/server/email";
import { formatDateTime } from "@/lib/utils";

export function EmailClient({
  subscribers,
  campaigns,
  mailConfigured,
}: {
  subscribers: SubscriberRow[];
  campaigns: CampaignRow[];
  mailConfigured: boolean;
}) {
  const router = useRouter();
  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("");
  const [sending, setSending] = React.useState(false);

  function send() {
    setSending(true);
    React.startTransition(async () => {
      const res = await sendCampaign(subject, body);
      setSending(false);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Sent to ${res.sent} subscribers`);
        setSubject("");
        setBody("");
        router.refresh();
      }
    });
  }

  return (
    <>
      <PageHeader
        title="Email marketing"
        sub={`${subscribers.length} ${subscribers.length === 1 ? "subscriber" : "subscribers"} on your list`}
      />

      {!mailConfigured && (
        <div className="mb-5 rounded-xl border border-warn/30 bg-warn-wash px-4 py-3 text-sm text-warn">
          Email sending isn&apos;t set up on this server yet. Campaigns will send
          for real once SMTP credentials (SMTP_HOST, SMTP_USER, SMTP_PASS,
          EMAIL_FROM) are configured — your Hostinger email provides these.
          Subscribers are still being collected in the meantime.
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        {/* composer */}
        <Card className="space-y-4 p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Mail className="size-4 text-ink-soft" />
            New campaign
          </h2>
          <div className="space-y-1.5">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="New arrivals just dropped 🎉"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              rows={8}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Hi there — we just added some new pieces we think you'll love…"
            />
          </div>
          <Button
            size="lg"
            onClick={send}
            disabled={sending || subscribers.length === 0}
          >
            {sending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            {sending
              ? "Sending…"
              : `Send to ${subscribers.length} ${subscribers.length === 1 ? "subscriber" : "subscribers"}`}
          </Button>
        </Card>

        {/* subscribers */}
        <Card className="p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Users className="size-4 text-ink-soft" />
            Subscribers
          </h2>
          {subscribers.length === 0 ? (
            <p className="mt-4 text-sm text-ink-soft">
              No subscribers yet. They join from the newsletter box on your
              storefront.
            </p>
          ) : (
            <ul className="mt-3 max-h-72 space-y-1 overflow-y-auto text-sm">
              {subscribers.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-2 border-b border-line py-1.5 last:border-0"
                >
                  <span className="truncate text-ink-body">{s.email}</span>
                  <span className="shrink-0 text-xs text-ink-soft">
                    {formatDateTime(s.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* history */}
      <Card className="mt-5">
        <div className="px-5 pt-5">
          <h2 className="text-sm font-semibold text-ink">Sent campaigns</h2>
        </div>
        {campaigns.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={<Send />}
              title="No campaigns sent yet"
              description="Compose your first campaign above."
            />
          </div>
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {campaigns.map((c) => (
              <li key={c.id} className="px-5 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-medium text-ink">
                    {c.subject}
                  </span>
                  <span className="shrink-0 text-xs text-ink-soft">
                    {formatDateTime(c.sentAt)} · {c.recipients} sent
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
