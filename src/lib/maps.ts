/**
 * Google Maps helpers for the storefront's "Find us" section. The owner can
 * paste a Maps link, or the embed code from Google Maps (Share > Embed a map).
 */

interface MapSource {
  mapsUrl?: string;
  mapsEmbed?: string;
  address?: string;
  district?: string;
  city?: string;
}

const GOOGLE_HOST = /^(www\.|maps\.)?google\.[a-z.]{2,6}$/;

/**
 * Pull a safe embed URL out of what the owner pasted: either the full
 * `<iframe src="…">` code or just its src. Only Google Maps embeds pass.
 */
export function extractEmbedSrc(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const text = raw.trim();
  const fromIframe = text.match(/<iframe[^>]*\ssrc\s*=\s*["']([^"']+)["']/i);
  const candidate = (fromIframe ? fromIframe[1] : text).replace(/&amp;/g, "&");
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (!GOOGLE_HOST.test(url.hostname)) return null;
  const isEmbed =
    url.pathname.startsWith("/maps/embed") ||
    /^\/maps\/d\/(u\/\d+\/)?embed/.test(url.pathname) ||
    (url.pathname === "/maps" && url.searchParams.get("output") === "embed");
  return isEmbed ? url.toString() : null;
}

/** Latitude and longitude found in a Maps link or embed URL, if any. */
export function coordsFrom(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const text = raw.replace(/&amp;/g, "&");
  const ok = (lat: string, lng: string) =>
    Math.abs(Number(lat)) <= 90 && Math.abs(Number(lng)) <= 180
      ? `${Number(lat)},${Number(lng)}`
      : null;
  // Embed code: …!2d<lng>!3d<lat>…
  const embed = text.match(/!2d(-?\d+(?:\.\d+)?)!3d(-?\d+(?:\.\d+)?)/);
  if (embed) return ok(embed[2], embed[1]);
  // Place links: …!3d<lat>!4d<lng>
  const place = text.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (place) return ok(place[1], place[2]);
  // …/@<lat>,<lng>,17z
  const at = text.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (at) return ok(at[1], at[2]);
  // ?q=<lat>,<lng> or ?query= / ?ll= / ?destination=
  const q = text.match(
    /[?&](?:q|query|ll|destination)=(-?\d+(?:\.\d+)?)(?:,|%2C)(-?\d+(?:\.\d+)?)/i,
  );
  if (q) return ok(q[1], q[2]);
  return null;
}

function addressQuery(s: MapSource): string | null {
  const parts = [s.address, s.district, s.city]
    .map((p) => p?.trim())
    .filter(Boolean);
  if (!parts.length) return null;
  return [...parts, "Lebanon"].join(", ");
}

/** The URL to show in the map iframe, or null when there's nothing to show. */
export function mapEmbedSrc(s: MapSource): string | null {
  const pasted = extractEmbedSrc(s.mapsEmbed);
  if (pasted) return pasted;
  const coords = coordsFrom(s.mapsUrl);
  if (coords) return `https://www.google.com/maps?q=${coords}&z=16&output=embed`;
  const address = addressQuery(s);
  if (address)
    return `https://www.google.com/maps?q=${encodeURIComponent(address)}&z=15&output=embed`;
  return null;
}

/** A link that opens Google Maps directions to the store. */
export function directionsUrl(s: MapSource): string | null {
  const coords = coordsFrom(s.mapsEmbed) ?? coordsFrom(s.mapsUrl);
  if (coords)
    return `https://www.google.com/maps/dir/?api=1&destination=${coords}`;
  const address = addressQuery(s);
  if (address)
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
  // A short link (maps.app.goo.gl) carries no coordinates: open it as is.
  const link = s.mapsUrl?.trim();
  if (link && /^https:\/\//i.test(link)) return link;
  return null;
}
