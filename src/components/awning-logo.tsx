import { cn } from "@/lib/utils";

/**
 * The Awning wordmark: a small striped awning drawn in SVG + the name set in
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
  const stripe = tone === "dark" ? "#7fc39b" : "#114b32";
  const gap = tone === "dark" ? "#0b3423" : "#faf9f5";

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg
        width={mark}
        height={mark * 0.78}
        viewBox="0 0 32 25"
        fill="none"
        aria-hidden
      >
        {/* awning canopy with scalloped hem */}
        <path
          d="M2 10 L6 2 H26 L30 10 Z"
          fill={stripe}
        />
        {[2, 7.6, 13.2, 18.8, 24.4].map((x, i) => (
          <path
            key={x}
            d={`M${x} 10 h5.6 v3 a2.8 2.8 0 0 1 -5.6 0 Z`}
            fill={i % 2 === 0 ? stripe : gap}
            stroke={stripe}
            strokeWidth="0.6"
          />
        ))}
        {/* shop counter */}
        <rect x="8" y="17" width="16" height="2.2" rx="1.1" fill={stripe} opacity="0.55" />
        <rect x="11" y="21.5" width="10" height="2.2" rx="1.1" fill={stripe} opacity="0.3" />
      </svg>
      <span
        className={cn(
          "font-display font-bold tracking-tight leading-none",
          text,
          tone === "dark" ? "text-white" : "text-ink"
        )}
      >
        awning
      </span>
    </span>
  );
}
