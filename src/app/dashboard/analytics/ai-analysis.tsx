"use client";

import * as React from "react";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import { Card } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { analyseSales } from "./ai-actions";
import type { SalesAnalysis, SalesSnapshot } from "./analysis-types";

/**
 * Asks the AI to read this page's numbers and say what to do next. Nothing
 * runs until the owner presses the button, since each run uses their daily
 * AI allowance.
 */
export function AiAnalysis({
  snapshot,
  aiReady,
}: {
  snapshot: SalesSnapshot;
  aiReady: boolean;
}) {
  const [analysis, setAnalysis] = React.useState<SalesAnalysis | null>(null);
  const [error, setError] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  function run() {
    setError("");
    startTransition(async () => {
      const res = await analyseSales(snapshot);
      if (res.error || !res.analysis) {
        setError(res.error ?? "Something went wrong. Try again.");
        return;
      }
      setAnalysis(res.analysis);
    });
  }

  return (
    <Card className="mt-5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-xl">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Sparkles className="size-4 text-green" aria-hidden />
            AI sales advice
          </h2>
          <p className="mt-0.5 text-xs text-ink-soft">
            Reads the numbers on this page for the last {snapshot.rangeDays}{" "}
            days and tells you what to do to sell more.
          </p>
        </div>
        <Button
          size="sm"
          variant={analysis ? "outline" : "primary"}
          onClick={run}
          disabled={pending || !aiReady}
        >
          {pending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : analysis ? (
            <RefreshCw className="size-3.5" />
          ) : (
            <Sparkles className="size-3.5" />
          )}
          {pending
            ? "Reading your numbers…"
            : analysis
              ? "Analyse again"
              : "Analyse my sales"}
        </Button>
      </div>

      {!aiReady && (
        <p className="mt-3 text-xs text-ink-soft">
          AI advice isn&apos;t switched on for Shopleb yet.
        </p>
      )}
      {pending && !analysis && (
        <p className="mt-4 text-sm text-ink-soft" role="status">
          This takes up to half a minute.
        </p>
      )}
      {error && (
        <p className="mt-4 text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      {analysis && (
        <div className="mt-5 space-y-6 border-t border-line pt-5" aria-live="polite">
          <p className="max-w-prose text-[15px] leading-relaxed text-ink">
            {analysis.summary}
          </p>

          {(analysis.working.length > 0 || analysis.watch.length > 0) && (
            <div className="grid gap-6 md:grid-cols-2">
              {analysis.working.length > 0 && (
                <section>
                  <h3 className="text-[13px] font-semibold text-ok">
                    What&apos;s working
                  </h3>
                  <ul className="mt-2 space-y-2 text-sm leading-relaxed text-ink-body">
                    {analysis.working.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </section>
              )}
              {analysis.watch.length > 0 && (
                <section>
                  <h3 className="text-[13px] font-semibold text-warn">
                    What to watch
                  </h3>
                  <ul className="mt-2 space-y-2 text-sm leading-relaxed text-ink-body">
                    {analysis.watch.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}

          {analysis.actions.length > 0 && (
            <section>
              <h3 className="text-[13px] font-semibold text-ink">
                What to do next
              </h3>
              <ol className="mt-3 space-y-4">
                {analysis.actions.map((a, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-green text-xs font-semibold text-white">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink">{a.title}</p>
                      <p className="mt-0.5 text-sm leading-relaxed text-ink-body">
                        {a.how}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                        Why: {a.why}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <p className="text-xs text-ink-soft">
            Written by AI from your own numbers. Treat it as a suggestion and
            check it against what you know about your customers.
          </p>
        </div>
      )}
    </Card>
  );
}
