"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, type AuthState } from "@/app/(auth)/actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState<AuthState, FormData>(login, {});

  return (
    <div className="animate-fade-up">
      <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
        Welcome back
      </h1>
      <p className="mt-2 text-ink-soft">
        Log in to see what sold while you were away.
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
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <button
              type="button"
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
    </div>
  );
}
