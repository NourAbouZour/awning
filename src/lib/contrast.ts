/**
 * Contrast helpers: given any brand color a merchant picks, decide whether
 * text on top of it should be black or white so buttons always stay readable.
 */

export function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  if (Number.isNaN(n) || h.length !== 6) return [0, 0, 0];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** WCAG relative luminance, 0 (black) to 1 (white). */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contrast ratio between two colors, 1..21. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [light, dark] = la > lb ? [la, lb] : [lb, la];
  return (light + 0.05) / (dark + 0.05);
}

/** Black or white — whichever reads better on the given background. */
export function readableOn(background: string): "#000000" | "#ffffff" {
  return contrastRatio(background, "#ffffff") >=
    contrastRatio(background, "#000000")
    ? "#ffffff"
    : "#000000";
}

/** Slightly darken a hex color (for hover states on brand buttons). */
export function shade(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const f = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v * (1 - amount))));
  return `#${[f(r), f(g), f(b)]
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("")}`;
}

/** Very light tint of a hex color (for wash backgrounds). */
export function tint(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const f = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v + (255 - v) * amount)));
  return `#${[f(r), f(g), f(b)]
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("")}`;
}
