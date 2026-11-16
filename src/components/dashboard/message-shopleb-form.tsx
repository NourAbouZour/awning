"use client";

import * as React from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { Card } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  messageShopleb,
  type MessageTopic,
} from "@/app/dashboard/contact/actions";
import { cn } from "@/lib/utils";

/**
 * A message box that reaches the Shopleb team (it shows up in the
 * superadmin's Messages). With several topics the sender picks one first.
 */
export function MessageShoplebForm({
  topics,
  title,
  description,
  label = "Your message",
  placeholder,
  sendLabel = "Send message",
}: {
  topics: { id: MessageTopic; label: string }[];
  title: string;
  description: string;
  label?: string;
  placeholder?: string;
  sendLabel?: string;
}) {
  const [topic, setTopic] = React.useState<MessageTopic>(topics[0].id);
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState("");
  const [state, setState] = React.useState<"idle" | "sending" | "sent">("idle");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setState("sending");
    React.startTransition(async () => {
      const res = await messageShopleb(topic, message);
      if (res.error) {
        setError(res.error);
        setState("idle");
      } else {
        setState("sent");
      }
    });
  }

  if (state === "sent") {
    return (
      <Card className="mx-auto max-w-xl p-8 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-green-wash">
          <CheckCircle2 className="size-7 text-green" />
        </span>
        <h2 className="mt-5 text-lg font-semibold text-ink" role="status">
          Message sent
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-body">
          The Shopleb team has it and will get back to you.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-6"
          onClick={() => {
            setMessage("");
            setState("idle");
          }}
        >
          Send another
        </Button>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-xl p-6 sm:p-8">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-body">
        {description}
      </p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        {topics.length > 1 && (
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-ink">
              What is it about?
            </legend>
            <div className="flex flex-wrap gap-2">
              {topics.map((t) => (
                <label
                  key={t.id}
                  className={cn(
                    "cursor-pointer rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors",
                    topic === t.id
                      ? "border-green bg-green-wash text-green"
                      : "border-line text-ink-body hover:border-line-strong",
                  )}
                >
                  <input
                    type="radio"
                    name="topic"
                    value={t.id}
                    checked={topic === t.id}
                    onChange={() => setTopic(t.id)}
                    className="sr-only"
                  />
                  {t.label}
                </label>
              ))}
            </div>
          </fieldset>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="shopleb-message">{label}</Label>
          <Textarea
            id="shopleb-message"
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={placeholder}
            maxLength={4000}
            required
          />
        </div>
        {error && (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        )}
        <Button size="lg" disabled={state === "sending"}>
          {state === "sending" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
          {state === "sending" ? "Sending…" : sendLabel}
        </Button>
      </form>
    </Card>
  );
}
