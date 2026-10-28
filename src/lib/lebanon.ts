/**
 * Lebanese governorates ("cities") and their districts (cazas), used by the
 * store Address settings so merchants pick from dropdowns instead of typing.
 */
export const LEBANON: { governorate: string; districts: string[] }[] = [
  { governorate: "Beirut", districts: ["Beirut"] },
  {
    governorate: "Mount Lebanon",
    districts: ["Aley", "Baabda", "Byblos (Jbeil)", "Chouf", "Keserwan", "Matn"],
  },
  {
    governorate: "North",
    districts: [
      "Batroun",
      "Bsharri",
      "Koura",
      "Miniyeh-Danniyeh",
      "Tripoli",
      "Zgharta",
    ],
  },
  { governorate: "Akkar", districts: ["Akkar"] },
  {
    governorate: "Beqaa",
    districts: ["Rashaya", "Western Beqaa", "Zahle"],
  },
  { governorate: "Baalbek-Hermel", districts: ["Baalbek", "Hermel"] },
  {
    governorate: "Nabatieh",
    districts: ["Bint Jbeil", "Hasbaya", "Marjeyoun", "Nabatieh"],
  },
  { governorate: "South", districts: ["Jezzine", "Sidon (Saida)", "Tyre (Sour)"] },
];

export const LEBANON_CITIES = LEBANON.map((g) => g.governorate);

export function districtsFor(city: string): string[] {
  return LEBANON.find((g) => g.governorate === city)?.districts ?? [];
}

/**
 * Build a Google Maps link for a store. Prefers an explicit pasted maps URL;
 * otherwise searches for the assembled address within Lebanon.
 */
export function mapsLinkFor(opts: {
  mapsUrl?: string;
  address?: string;
  district?: string;
  city?: string;
}): string | null {
  if (opts.mapsUrl && opts.mapsUrl.trim()) return opts.mapsUrl.trim();
  const parts = [opts.address, opts.district, opts.city, "Lebanon"].filter(
    (p) => p && p.trim(),
  );
  if (parts.length <= 1) return null; // only "Lebanon" — not worth a link
  const query = encodeURIComponent(parts.join(", "));
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}
