/**
 * Every font the platform can serve, self-hosted via next/font.
 *
 * - Bricolage Grotesque + Inter are the platform's own voice (marketing site,
 *   dashboard, onboarding).
 * - The rest power the five curated storefront pairings a merchant can pick.
 *   Each pairing exposes two CSS variables that the storefront theme consumes:
 *   `--sf-display` and `--sf-body`.
 */
import {
  Archivo,
  Bricolage_Grotesque,
  Fraunces,
  Inter,
  Lora,
  Manrope,
  Playfair_Display,
  Space_Grotesk,
} from "next/font/google";

export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

export const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz", "SOFT", "WONK"],
});

export const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});

export const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
});

/** Class string that makes every font variable available under <html>. */
export const allFontVariables = [
  inter.variable,
  bricolage.variable,
  fraunces.variable,
  archivo.variable,
  spaceGrotesk.variable,
  manrope.variable,
  playfair.variable,
  lora.variable,
].join(" ");

export type FontPairingId =
  | "editorial"
  | "bold"
  | "modern"
  | "minimal"
  | "classic";

export interface FontPairing {
  id: FontPairingId;
  label: string;
  blurb: string;
  /** CSS value for --sf-display */
  display: string;
  /** CSS value for --sf-body */
  body: string;
  /** Font weight used for storefront display headings. */
  displayWeight: number;
}

export const FONT_PAIRINGS: FontPairing[] = [
  {
    id: "editorial",
    label: "Editorial",
    blurb: "Expressive serif headlines, quiet body. For considered brands.",
    display: "var(--font-fraunces), Georgia, serif",
    body: "var(--font-inter), system-ui, sans-serif",
    displayWeight: 500,
  },
  {
    id: "bold",
    label: "Bold",
    blurb: "Heavy, loud, athletic. For brands that shout.",
    display: "var(--font-archivo), system-ui, sans-serif",
    body: "var(--font-archivo), system-ui, sans-serif",
    displayWeight: 800,
  },
  {
    id: "modern",
    label: "Modern",
    blurb: "Geometric and technical. For products with an edge.",
    display: "var(--font-space-grotesk), system-ui, sans-serif",
    body: "var(--font-inter), system-ui, sans-serif",
    displayWeight: 600,
  },
  {
    id: "minimal",
    label: "Minimal",
    blurb: "One quiet family everywhere. Lets photography lead.",
    display: "var(--font-manrope), system-ui, sans-serif",
    body: "var(--font-manrope), system-ui, sans-serif",
    displayWeight: 600,
  },
  {
    id: "classic",
    label: "Classic",
    blurb: "High-contrast serif romance. For timeless, formal brands.",
    display: "var(--font-playfair), Georgia, serif",
    body: "var(--font-lora), Georgia, serif",
    displayWeight: 600,
  },
];

export function getFontPairing(id: string): FontPairing {
  return FONT_PAIRINGS.find((p) => p.id === id) ?? FONT_PAIRINGS[0];
}
