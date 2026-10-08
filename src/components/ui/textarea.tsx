import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[110px] w-full rounded-lg border border-line-strong bg-paper px-3.5 py-2.5 text-sm text-ink-body transition-colors",
      "placeholder:text-ink-soft/70",
      "focus:border-green focus:outline-none focus:ring-2 focus:ring-green/15",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-danger/15",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };
