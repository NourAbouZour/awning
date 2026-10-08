import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Polished empty state used across the dashboard. The "illustration" is a
 * drawn-in-CSS awning over a counter — on brand, no image assets needed.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong bg-paper px-6 py-16 text-center",
        className
      )}
    >
      <div className="relative mb-6" aria-hidden>
        {/* tiny awning illustration */}
        <div className="w-28">
          <div className="h-5 rounded-t-md awning-stripes opacity-90" style={{ backgroundSize: "auto" }} />
          <div className="scallop awning-stripes w-full" />
          <div className="mx-auto mt-3 flex h-12 w-20 items-center justify-center rounded-md border border-line-strong bg-canvas">
            {icon && <span className="text-ink-soft [&_svg]:size-5">{icon}</span>}
          </div>
        </div>
      </div>
      <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-soft">
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
