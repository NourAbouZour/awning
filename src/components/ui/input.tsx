import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-lg border border-line-strong bg-paper px-3.5 text-sm text-ink-body transition-colors",
        "placeholder:text-ink-soft/70",
        "focus:border-green focus:outline-none focus:ring-2 focus:ring-green/15",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-danger/15",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
