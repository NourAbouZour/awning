"use client";

import * as React from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitSupportRequest } from "@/app/(marketing)/pricing/actions";

export function PricingContactForm() {
  const [values, setValues] = React.useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [error, setError] = React.useState("");
  const [state, setState] = React.useState<"idle" | "sending" | "sent">("idle");

  function set<K extends keyof typeof values>(key: K, v: string) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setState("sending");
    React.startTransition(async () => {
      const res = await submitSupportRequest(values);
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
      <div
        className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-line bg-paper px-6 py-12 text-center"
        role="status"
      >
        <span className="flex size-14 items-center justify-center rounded-full bg-green">
          <Check className="size-7 text-white" />
        </span>
        <p className="mt-5 font-display text-2xl font-bold text-ink">
          Message sent
        </p>
        <p className="mt-2 max-w-sm text-sm text-ink-soft">
          Thanks, {values.name.split(" ")[0] || "there"} — we&apos;ll get back
          to you by email soon.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="rounded-2xl border border-line bg-paper p-6 md:p-8"
    >
      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger"
        >
          {error}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="c-name">Your name</Label>
          <Input
            id="c-name"
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Alex Rivera"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-email">Email</Label>
          <Input
            id="c-email"
            type="email"
            value={values.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="alex@example.com"
          />
        </div>
      </div>
      <div className="mt-4 space-y-1.5">
        <Label htmlFor="c-subject">Subject</Label>
        <Input
          id="c-subject"
          value={values.subject}
          onChange={(e) => set("subject", e.target.value)}
          placeholder="A question about plans"
        />
      </div>
      <div className="mt-4 space-y-1.5">
        <Label htmlFor="c-message">Message</Label>
        <Textarea
          id="c-message"
          rows={4}
          value={values.message}
          onChange={(e) => set("message", e.target.value)}
          placeholder="How can we help?"
        />
      </div>
      <Button
        size="lg"
        className="mt-5"
        disabled={state === "sending"}
      >
        {state === "sending" && <Loader2 className="size-4 animate-spin" />}
        {state === "sending" ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
