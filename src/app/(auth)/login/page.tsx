"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  login,
  requestPasswordReset,
  resetPasswordWithCode,
  type AuthState,
  type ResetState,
} from "@/app/(auth)/actions";

type Mode = "login" | "forgot" | "code";

function ErrorNote({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger"
    >
      {message}
    </p>
  );
}

function BackToLogin({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-5 inline-flex items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-ink"
    >
      <ArrowLeft className="size-3.5" />
      Back to log in
    </button>
  );
}

export default function LoginPage() {
  const [mode, setMode] = React.useState<Mode>("login");
  const [email, setEmail] = React.useState("");
  const [changed, setChanged] = React.useState(false);

  return (
    <div className="animate-fade-up">
      {mode === "login" && (
        <LoginForm
          email={email}
          setEmail={setEmail}
          changed={changed}
          onForgot={() => {
            setChanged(false);
            setMode("forgot");
          }}
        />
      )}
      {mode === "forgot" && (
        <ForgotForm
          email={email}
          setEmail={setEmail}
          onBack={() => setMode("login")}
          onHaveCode={() => setMode("code")}
        />
      )}
      {mode === "code" && (
        <CodeForm
          email={email}
          setEmail={setEmail}
          onBack={() => setMode("login")}
          onNeedCode={() => setMode("forgot")}
          onDone={() => {
            setChanged(true);
            setMode("login");
          }}
        />
      )}
    </div>
  );
}

function LoginForm({
  email,
  setEmail,
  changed,
  onForgot,
}: {
  email: string;
  setEmail: (v: string) => void;
  changed: boolean;
  onForgot: () => void;
}) {
  const [state, action, pending] = useActionState<AuthState, FormData>(login, {});
  return (
    <>
      <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
        Welcome back
      </h1>
      <p className="mt-2 text-ink-soft">
        Log in to see what sold while you were away.
      </p>

      <form action={action} className="mt-8 space-y-4">
        {changed && !state.error && (
          <p
            role="status"
            className="flex items-center gap-2 rounded-lg border border-green/25 bg-green-wash px-3 py-2 text-sm text-green"
          >
            <CheckCircle2 className="size-4 shrink-0" />
            Password changed. Log in with your new password.
          </p>
        )}
        <ErrorNote message={state.error} />
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="alex@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <button
              type="button"
              onClick={onForgot}
              className="text-xs text-green underline-offset-4 hover:underline"
            >
              Forgot it?
            </button>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        <Button size="lg" className="w-full" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          {pending ? "Logging in…" : "Log in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        New here?{" "}
        <Link
          href="/signup"
          className="font-medium text-green underline-offset-4 hover:underline"
        >
          Open your shop free
        </Link>
      </p>
    </>
  );
}

function ForgotForm({
  email,
  setEmail,
  onBack,
  onHaveCode,
}: {
  email: string;
  setEmail: (v: string) => void;
  onBack: () => void;
  onHaveCode: () => void;
}) {
  const [state, action, pending] = useActionState<ResetState, FormData>(
    requestPasswordReset,
    {},
  );

  if (state.sent) {
    return (
      <>
        <BackToLogin onClick={onBack} />
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
          We got your request
        </h1>
        <p className="mt-2 text-ink-soft">
          The Shopleb team will contact you with a 6-digit code. The code works
          once and only for 5 minutes, so type it in as soon as you get it.
        </p>
        <Button size="lg" className="mt-8 w-full" onClick={onHaveCode}>
          I have my code
        </Button>
      </>
    );
  }

  return (
    <>
      <BackToLogin onClick={onBack} />
      <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
        Forgot your password?
      </h1>
      <p className="mt-2 text-ink-soft">
        Tell us your email. The Shopleb team will send you a one-time code to
        set a new password.
      </p>

      <form action={action} className="mt-8 space-y-4">
        <ErrorNote message={state.error} />
        <div className="space-y-1.5">
          <Label htmlFor="forgot-email">Email</Label>
          <Input
            id="forgot-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="alex@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <Button size="lg" className="w-full" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          {pending ? "Sending…" : "Ask for a code"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Already have a code?{" "}
        <button
          type="button"
          onClick={onHaveCode}
          className="font-medium text-green underline-offset-4 hover:underline"
        >
          Enter it
        </button>
      </p>
    </>
  );
}

function CodeForm({
  email,
  setEmail,
  onBack,
  onNeedCode,
  onDone,
}: {
  email: string;
  setEmail: (v: string) => void;
  onBack: () => void;
  onNeedCode: () => void;
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState<ResetState, FormData>(
    resetPasswordWithCode,
    {},
  );

  // The action reports success once; hand control back to the login form.
  const reported = React.useRef(false);
  React.useEffect(() => {
    if (state.done && !reported.current) {
      reported.current = true;
      onDone();
    }
  }, [state.done, onDone]);

  return (
    <>
      <BackToLogin onClick={onBack} />
      <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
        Set a new password
      </h1>
      <p className="mt-2 text-ink-soft">
        Type the 6-digit code the Shopleb team gave you, then choose a new
        password.
      </p>

      <form action={action} className="mt-8 space-y-4">
        <ErrorNote message={state.error} />
        <div className="space-y-1.5">
          <Label htmlFor="code-email">Email</Label>
          <Input
            id="code-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="code">One-time code</Label>
          <Input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9 ]*"
            maxLength={7}
            placeholder="6 digits"
            className="text-lg tracking-[0.3em]"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="new-password">New password</Label>
          <Input
            id="new-password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
          <p className="text-xs text-ink-soft">At least 8 characters.</p>
        </div>
        <Button size="lg" className="w-full" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          {pending ? "Saving…" : "Change password"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Code expired?{" "}
        <button
          type="button"
          onClick={onNeedCode}
          className="font-medium text-green underline-offset-4 hover:underline"
        >
          Ask for a new one
        </button>
      </p>
    </>
  );
}
