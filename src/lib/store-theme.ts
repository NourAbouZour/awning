import type { CSSProperties } from "react";
import { getFontPairing } from "@/lib/fonts";
import { readableOn, shade, tint } from "@/lib/contrast";
import type { StoreTheme } from "@/lib/types";

/**
 * Turns a merchant's theme choices into the CSS custom properties the
 * storefront template consumes. Applied inline on the storefront wrapper,
 * so every store gets its own look from the same markup.
 */
export function themeStyle(theme: StoreTheme): CSSProperties {
  const pairing = getFontPairing(theme.fontPairing);
  return {
    "--sf-brand": theme.brandColor,
    "--sf-on-brand": readableOn(theme.brandColor),
    "--sf-brand-hover": shade(theme.brandColor, 0.16),
    "--sf-wash": tint(theme.brandColor, 0.92),
    "--sf-display": pairing.display,
    "--sf-body": pairing.body,
    "--sf-display-weight": pairing.displayWeight,
  } as CSSProperties;
}
