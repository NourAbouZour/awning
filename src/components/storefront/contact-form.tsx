"use client";

import * as React from "react";
import { Check, Loader2 } from "lucide-react";
import { submitContactMessage } from "@/app/s/[store]/actions";
import { cn } from "@/lib/utils";

const fields = [
  { id: "name", label: "Your name", type: "text", autoComplete: "name" },
  { id: "email", label: "Email", type: "email", autoComplete: "email" },
  { id: "subject", label: "Subject", type: "text", autoComplete: "off" },
] as const;

export function ContactForm({
  storeName,
  storeSlug,
}: {
  storeName: string;
  storeSlug: string;
}) {
  const [values, setValues] = React.useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [state, setState] = React.useState<"idle" | "sending" | "sent">("idle");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (values.name.trim().length < 2) next.name = "Tell us your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
      next.email = "That doesn't look like an email address.";
    if (!values.subject.trim()) next.subject = "A few words about the topic.";
    if (values.message.trim().length < 10)
      next.message = "Give us a little more to go on — 10+ characters.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setState("sending");
    React.startTransition(async () => {
      const res = await submitContactMessage(storeSlug, {
        name: values.name,
        email: values.email,
        subject: values.subject,
        body: values.message,
      });
      if (res.error) {
        setState("idle");
        setErrors({ message: res.error });
      } else {
        setState("sent");
      }
    });
  }

  if (state === "sent") {
    return (
      <div
        className="flex h-full min-h-72 flex-col items-center justify-center rounded-2xl bg-sf-wash px-6 py-14 text-center"
        role="status"
      >
        <span className="flex size-14 items-center justify-center rounded-full bg-sf-brand">
          <Check className="size-7 text-sf-on-brand" />
        </span>
        <p className="sf-display mt-5 text-2xl">Message sent</p>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-sf-muted">
          Thanks for writing, {values.name.split(" ")[0]}. The {storeName} team
          reads every message and usually replies within a day.
        </p>
        <button
          onClick={() => {
            setValues({ name: "", email: "", subject: "", message: "" });
            setState("idle");
          }}
          className="mt-6 text-sm font-medium underline-offset-4 hover:underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  const inputClass = (invalid: boolean) =>
    cn(
      "h-12 w-full rounded-xl border bg-transparent px-4 text-sm outline-none transition-colors placeholder:text-sf-muted/60",
      invalid
        ? "border-sf-brand"
        : "border-sf-line focus:border-sf-ink"
    );

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {fields.map((f) => (
        <div key={f.id} className="space-y-1.5">
          <label htmlFor={f.id} className="block text-sm font-medium">
            {f.label}
          </label>
          <input
            id={f.id}
            type={f.type}
            autoComplete={f.autoComplete}
            value={values[f.id]}
            aria-invalid={!!errors[f.id]}
            onChange={(e) =>
              setValues((v) => ({ ...v, [f.id]: e.target.value }))
            }
            className={inputClass(!!errors[f.id])}
          />
          {errors[f.id] && (
            <p className="text-xs text-sf-brand" role="alert">
              {errors[f.id]}
            </p>
          )}
        </div>
      ))}
      <div className="space-y-1.5">
        <label htmlFor="message" className="block text-sm font-medium">
          Message
        </label>
        <textarea
          id="message"
          rows={5}
          value={values.message}
          aria-invalid={!!errors.message}
          onChange={(e) =>
            setValues((v) => ({ ...v, message: e.target.value }))
          }
          className={cn(
            inputClass(!!errors.message),
            "h-auto min-h-32 py-3 leading-relaxed"
          )}
        />
        {errors.message && (
          <p className="text-xs text-sf-brand" role="alert">
            {errors.message}
          </p>
        )}
      </div>
      <button
        disabled={state === "sending"}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-sf-brand py-4 text-sm font-semibold text-sf-on-brand transition-all hover:bg-sf-brand-hover active:scale-[0.99] disabled:opacity-70 sm:w-auto sm:px-10"
      >
        {state === "sending" && <Loader2 className="size-4 animate-spin" />}
        {state === "sending" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
