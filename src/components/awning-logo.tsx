import { cn } from "@/lib/utils";

/**
 * The Shopleb wordmark: a small shopping bag drawn in SVG + the name set in
 * the display face. `tone` flips it for dark surfaces.
 */
export function AwningLogo({
  className,
  tone = "light",
  size = "md",
}: {
  className?: string;
  tone?: "light" | "dark";
  size?: "sm" | "md" | "lg";
}) {
  const mark = size === "lg" ? 30 : size === "sm" ? 20 : 24;
  const text =
    size === "lg" ? "text-[26px]" : size === "sm" ? "text-[17px]" : "text-[21px]";
  const bag = tone === "dark" ? "#7fc39b" : "#114b32";
  const handle = "#f6a35c";

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg
        width={mark}
        height={mark}
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden
      >
        {/* shopping bag body */}
        <path
          d="M7 11 H25 L23.6 27 A2 2 0 0 1 21.6 28.8 H10.4 A2 2 0 0 1 8.4 27 Z"
          fill={bag}
        />
        {/* bag handle */}
        <path
          d="M11 12 V9.5 A5 5 0 0 1 21 9.5 V12"
          stroke={handle}
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <span
        className={cn(
          "font-display font-bold tracking-tight leading-none",
          text,
          tone === "dark" ? "text-white" : "text-ink"
        )}
      >
        Shopleb
      </span>
    </span>
  );
}
