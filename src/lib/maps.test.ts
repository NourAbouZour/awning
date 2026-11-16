import { describe, it, expect } from "vitest";
import { coordsFrom, directionsUrl, extractEmbedSrc, mapEmbedSrc } from "./maps";

const EMBED =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3311.9!2d35.4955!3d33.8938!2m3!1f0!2f0!3f0";
const IFRAME = `<iframe src="${EMBED.replace(/&/g, "&amp;")}" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy"></iframe>`;

describe("extractEmbedSrc", () => {
  it("reads the src out of pasted iframe code", () => {
    expect(extractEmbedSrc(IFRAME)).toBe(EMBED);
  });
  it("accepts a bare embed URL", () => {
    expect(extractEmbedSrc(EMBED)).toBe(EMBED);
  });
  it("rejects anything that isn't a Google Maps embed", () => {
    expect(extractEmbedSrc('<iframe src="https://evil.example/maps/embed?x"></iframe>')).toBeNull();
    expect(extractEmbedSrc("https://www.google.com/search?q=x")).toBeNull();
    expect(extractEmbedSrc("javascript:alert(1)")).toBeNull();
    expect(extractEmbedSrc("http://www.google.com/maps/embed?pb=1")).toBeNull();
    expect(extractEmbedSrc("")).toBeNull();
  });
});

describe("coordsFrom", () => {
  it("reads coordinates from embeds and links", () => {
    expect(coordsFrom(EMBED)).toBe("33.8938,35.4955");
    expect(coordsFrom("https://www.google.com/maps/place/X/@33.89,35.5,17z")).toBe("33.89,35.5");
    expect(coordsFrom("https://www.google.com/maps?q=33.89,35.5")).toBe("33.89,35.5");
    expect(coordsFrom("https://maps.app.goo.gl/abc123")).toBeNull();
  });
});

describe("mapEmbedSrc and directionsUrl", () => {
  it("prefers the pasted embed, and directs to its coordinates", () => {
    const s = { mapsEmbed: IFRAME, city: "Beirut" };
    expect(mapEmbedSrc(s)).toBe(EMBED);
    expect(directionsUrl(s)).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=33.8938,35.4955",
    );
  });
  it("builds a map from the address when nothing is pasted", () => {
    const s = { address: "Hamra Street", city: "Beirut" };
    expect(mapEmbedSrc(s)).toContain("output=embed");
    expect(directionsUrl(s)).toContain("destination=Hamra%20Street");
  });
  it("opens a short link as is when there is no address", () => {
    const s = { mapsUrl: "https://maps.app.goo.gl/abc123" };
    expect(mapEmbedSrc(s)).toBeNull();
    expect(directionsUrl(s)).toBe("https://maps.app.goo.gl/abc123");
  });
  it("returns nothing with no location at all", () => {
    expect(mapEmbedSrc({})).toBeNull();
    expect(directionsUrl({})).toBeNull();
  });
});
