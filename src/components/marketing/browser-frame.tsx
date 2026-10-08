import { cn } from "@/lib/utils";

/** Minimal browser chrome used to frame storefront previews. */
export function BrowserFrame({
  url,
  children,
  className,
}: {
  url: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-line-strong bg-paper shadow-[0_32px_64px_-24px_rgb(17_75_50/0.25)]",
        className
      )}
    >
      <div className="flex items-center gap-2 border-b border-line bg-canvas px-3.5 py-2.5">
        <span className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-ink/15" />
          <span className="size-2.5 rounded-full bg-ink/15" />
          <span className="size-2.5 rounded-full bg-ink/15" />
        </span>
        <span className="ml-2 flex-1 truncate rounded-md bg-paper px-3 py-1 text-[11px] text-ink-soft border border-line">
          {url}
        </span>
      </div>
      {children}
    </div>
  );
}
