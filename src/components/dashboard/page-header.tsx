import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  sub,
  actions,
  className,
}: {
  title: string;
  sub?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-wrap items-start justify-between gap-4",
        className
      )}
    >
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
          {title}
        </h1>
        {sub && <p className="mt-1 text-sm text-ink-soft">{sub}</p>}
      </div>
      {actions && <div className="flex items-center gap-2.5">{actions}</div>}
    </div>
  );
}

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-line bg-paper",
        className
      )}
    >
      {children}
    </div>
  );
}
