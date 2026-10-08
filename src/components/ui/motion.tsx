"use client";

/**
 * Small, reduced-motion-aware animation primitives built on framer-motion.
 * Every component renders static markup when the user prefers reduced motion.
 */
import * as React from "react";
import {
  motion,
  useReducedMotion,
  useInView,
  animate,
  type Variants,
} from "framer-motion";
import { formatMoney } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Fade + rise into view on scroll. */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 18,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

/** A container whose StaggerItem children animate in sequence on scroll. */
export function Stagger({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} variants={itemVariants}>
      {children}
    </motion.div>
  );
}

// `format` is a serializable string (not a function) so AnimatedNumber can be
// rendered from server components — RSC forbids passing functions across the
// server/client boundary.
function formatValue(n: number, format: "plain" | "money"): string {
  return format === "money"
    ? formatMoney(n)
    : Math.round(n).toLocaleString();
}

/** Counts up to `value` the first time it scrolls into view. */
export function AnimatedNumber({
  value,
  format = "plain",
  className,
  duration = 1.1,
}: {
  value: number;
  format?: "plain" | "money";
  className?: string;
  duration?: number;
}) {
  const reduce = useReducedMotion();
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = React.useState(reduce ? value : 0);

  React.useEffect(() => {
    if (reduce) {
      setDisplay(value);
      return;
    }
    if (!inView) return;
    const controls = animate(0, value, {
      duration,
      ease: EASE,
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [inView, value, reduce, duration]);

  return (
    <span ref={ref} className={className}>
      {formatValue(display, format)}
    </span>
  );
}
