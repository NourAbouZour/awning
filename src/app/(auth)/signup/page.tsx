"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signup, type AuthState } from "@/app/(auth)/actions";

export default function SignupPage() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    signup,
    {},
  );

  return (
    <div className="animate-fade-up">
      <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
        Open your shop
      </h1>
      <p className="mt-2 text-ink-soft">
        Free to start. You&apos;ll be picking a storefront color in about a
        minute.
      </p>

      <form action={action} className="mt-8 space-y-4">
        {state.error && (
          <p
            role="alert"
            className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger"
          >
            {state.error}
          </p>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="name">Your name</Label>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            placeholder="Alex Rivera"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="alex@example.com"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="8+ characters"
            required
          />
        </div>
        <Button size="lg" className="w-full" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          {pending ? "Creating your account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Already selling on Awning?{" "}
        <Link
          href="/login"
          className="font-medium text-green underline-offset-4 hover:underline"
        >
          Log in
        </Link>
      </p>
      <p className="mt-3 text-center text-xs leading-relaxed text-ink-soft">
        By continuing you agree to our terms of service and privacy policy.
      </p>
    </div>
  );
}
