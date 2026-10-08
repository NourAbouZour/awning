/**
 * Mock data standing in for the database while the UI is built.
 * Two demo stores prove the storefront template handles opposite brands:
 *  - VOLTA: loud sneaker/streetwear brand (electric orange, Archivo)
 *  - ODE:   calm skincare brand (deep sage, Fraunces)
 * The dashboard is "logged in" as VOLTA's owner.
 */
import type {
  ContactMessage,
  Customer,
  Order,
  Store,
} from "@/lib/types";

/** Unsplash helper — stable CDN URLs, resized server-side. */
const u = (id: string, w = 1400) =>
  `https://images.unsplash.com/${id}?q=80&w=${w}&auto=format&fit=crop`;

/* ------------------------------------------------------------------ */
/* VOLTA — sneakers & streetwear                                       */
/* ------------------------------------------------------------------ */

export const voltaStore: Store = {
  id: "store_volta",
  name: "VOLTA",
  slug: "volta",
  logoText: "VOLTA",
  tagline: "Footwear for people in a hurry",
  contactEmail: "hello@wearvolta.com",
  phone: "+1 (415) 555-0188",
  address: "829 Valencia St, San Francisco, CA 94110",
  hours: "Mon–Sat 10am–7pm, Sun 11am–5pm",
  currency: "USD",
  shippingNote: "Free US shipping over $75. Returns within 30 days, no questions.",
  theme: {
    brandColor: "#f54a00",
    fontPairing: "bold",
    announcement: "Free shipping over $75 — new drops every Friday",
    heroImage: u("photo-1556906781-9a412961c28c", 2400),
    heroHeadline: "Built to move. Made to last.",
    heroSub: "Performance sneakers and streetwear, designed in San Francisco and worn everywhere.",
    heroCta: "Shop the drop",
    storyImage: u("photo-1519744792095-2f2205e87b6f", 1800),
    storyTitle: "We started on a track, not in a boardroom",
    storyBody:
      "VOLTA began in 2019 when two college sprinters got tired of choosing between shoes that performed and shoes that looked good. Every pair we make is tested by real runners on real pavement for six months before it ships. If it doesn't survive the city, it doesn't get a box.",
    footerText: "VOLTA · Designed in San Francisco. Worn everywhere.",
    sections: [
      { id: "hero", enabled: true },
      { id: "collections", enabled: true },
      { id: "carousel", enabled: true },
      { id: "story", enabled: true },
      { id: "trust", enabled: true },
      { id: "newsletter", enabled: true },
    ],
    socials: { instagram: "wearvolta", tiktok: "wearvolta", twitter: "wearvolta" },
  },
  categories: [
    { id: "cat_sneakers", name: "Sneakers", slug: "sneakers", image: u("photo-1552346154-21d32810aba3", 1200) },
    { id: "cat_apparel", name: "Apparel", slug: "apparel", image: u("photo-1556821840-3a63f95609a7", 1200) },
    { id: "cat_accessories", name: "Accessories", slug: "accessories", image: u("photo-1553062407-98eeb64c6a62", 1200) },
  ],
  products: [
    {
      id: "p_volta_01",
      slug: "circuit-runner-ember",
      title: "Circuit Runner — Ember",
      description:
        "Our flagship daily trainer. A nitrogen-infused midsole returns 78% of every stride, while the engineered-knit upper breathes through city summers. The Ember colorway is dyed in small batches, so no two pairs match exactly.",
      details: "",
      price: 148,
      compareAt: 180,
      images: [u("photo-1542291026-7eec264c27ff"), u("photo-1549298916-b41d501d3772")],
      categoryId: "cat_sneakers",
      variantGroup: {
        label: "Size",
        variants: [
          { id: "v1", name: "US 8", stock: 12 },
          { id: "v2", name: "US 9", stock: 8 },
          { id: "v3", name: "US 10", stock: 5 },
          { id: "v4", name: "US 11", stock: 0 },
          { id: "v5", name: "US 12", stock: 3 },
        ],
      },
      inventory: 28,
      sku: "VLT-CR-EMB",
      status: "active",
      featured: true,
      createdAt: "2026-09-02T10:00:00Z",
    },
    {
      id: "p_volta_02",
      slug: "court-classic-white",
      title: "Court Classic — White",
      description:
        "A tennis silhouette stripped to its essentials. Full-grain leather that scuffs beautifully, a gum cupsole, and nothing else. The shoe you reach for when you don't want to think about shoes.",
      details: "",
      price: 118,
      images: [u("photo-1595950653106-6c9ebd614d3a"), u("photo-1514989940723-e8e51635b782")],
      categoryId: "cat_sneakers",
      variantGroup: {
        label: "Size",
        variants: [
          { id: "v1", name: "US 8", stock: 20 },
          { id: "v2", name: "US 9", stock: 14 },
          { id: "v3", name: "US 10", stock: 11 },
          { id: "v4", name: "US 11", stock: 6 },
        ],
      },
      inventory: 51,
      sku: "VLT-CC-WHT",
      status: "active",
      featured: true,
      createdAt: "2026-08-21T10:00:00Z",
    },
    {
      id: "p_volta_03",
      slug: "apex-trail-storm",
      title: "Apex Trail — Storm",
      description:
        "Trail grip meets street geometry. A Vibram-style lug outsole handles mud and scree; the ripstop upper shrugs off weather. Tested on 400 miles of Marin headlands before release.",
      details: "",
      price: 164,
      images: [u("photo-1606107557195-0e29a4b5b4aa"), u("photo-1600185365926-3a2ce3cdb9eb")],
      categoryId: "cat_sneakers",
      variantGroup: {
        label: "Size",
        variants: [
          { id: "v1", name: "US 8", stock: 7 },
          { id: "v2", name: "US 9", stock: 9 },
          { id: "v3", name: "US 10", stock: 4 },
          { id: "v4", name: "US 11", stock: 2 },
        ],
      },
      inventory: 22,
      sku: "VLT-AT-STM",
      status: "active",
      featured: true,
      createdAt: "2026-09-14T10:00:00Z",
    },
    {
      id: "p_volta_04",
      slug: "midnight-runner-black",
      title: "Midnight Runner — Black",
      description:
        "The Circuit Runner platform in full blackout, with 360° reflective threads woven through the knit. Invisible at noon, unmissable in headlights.",
      details: "",
      price: 152,
      images: [u("photo-1512374382149-233c42b6a83b"), u("photo-1539185441755-769473a23570")],
      categoryId: "cat_sneakers",
      variantGroup: {
        label: "Size",
        variants: [
          { id: "v1", name: "US 8", stock: 10 },
          { id: "v2", name: "US 9", stock: 0 },
          { id: "v3", name: "US 10", stock: 6 },
          { id: "v4", name: "US 11", stock: 8 },
        ],
      },
      inventory: 24,
      sku: "VLT-MR-BLK",
      status: "active",
      createdAt: "2026-07-30T10:00:00Z",
    },
    {
      id: "p_volta_05",
      slug: "volt-high-citrus",
      title: "Volt High — Citrus",
      description:
        "A high-top that refuses to whisper. Citrus-yellow suede, oversized tongue, double-stacked foam. Limited to 500 pairs per run.",
      details: "",
      price: 172,
      compareAt: 195,
      images: [u("photo-1560769629-975ec94e6a86"), u("photo-1562183241-b937e95585b6")],
      categoryId: "cat_sneakers",
      variantGroup: {
        label: "Size",
        variants: [
          { id: "v1", name: "US 8", stock: 3 },
          { id: "v2", name: "US 9", stock: 2 },
          { id: "v3", name: "US 10", stock: 1 },
        ],
      },
      inventory: 6,
      sku: "VLT-VH-CIT",
      status: "active",
      createdAt: "2026-09-25T10:00:00Z",
    },
    {
      id: "p_volta_06",
      slug: "aurora-low-rose",
      title: "Aurora Low — Rose",
      description:
        "Soft rose nubuck on the Court Classic last. Understated until the light hits the pearlescent heel tab.",
      details: "",
      price: 126,
      images: [u("photo-1603808033192-082d6919d3e1"), u("photo-1608231387042-66d1773070a5")],
      categoryId: "cat_sneakers",
      variantGroup: {
        label: "Size",
        variants: [
          { id: "v1", name: "US 6", stock: 9 },
          { id: "v2", name: "US 7", stock: 12 },
          { id: "v3", name: "US 8", stock: 7 },
          { id: "v4", name: "US 9", stock: 4 },
        ],
      },
      inventory: 32,
      sku: "VLT-AL-ROS",
      status: "active",
      createdAt: "2026-08-08T10:00:00Z",
    },
    {
      id: "p_volta_07",
      slug: "relay-slip-on-grey",
      title: "Relay Slip-On — Grey",
      description:
        "Zero laces, zero friction. Heel-collapse construction means you can step in hands-free and still sprint for the train.",
      details: "",
      price: 98,
      images: [u("photo-1491553895911-0055eca6402d"), u("photo-1525966222134-fcfa99b8ae77")],
      categoryId: "cat_sneakers",
      inventory: 44,
      sku: "VLT-RS-GRY",
      status: "active",
      createdAt: "2026-06-18T10:00:00Z",
    },
    {
      id: "p_volta_08",
      slug: "heavyweight-hoodie-ash",
      title: "Heavyweight Hoodie — Ash",
      description:
        "480gsm French terry, garment-dyed and enzyme-washed. The hood actually stays up. Pre-shrunk so the fit you buy is the fit you keep.",
      details: "",
      price: 88,
      images: [u("photo-1556821840-3a63f95609a7"), u("photo-1620799140408-edc6dcb6d633")],
      categoryId: "cat_apparel",
      variantGroup: {
        label: "Size",
        variants: [
          { id: "v1", name: "S", stock: 15 },
          { id: "v2", name: "M", stock: 22 },
          { id: "v3", name: "L", stock: 18 },
          { id: "v4", name: "XL", stock: 9 },
        ],
      },
      inventory: 64,
      sku: "VLT-HH-ASH",
      status: "active",
      featured: true,
      createdAt: "2026-09-10T10:00:00Z",
    },
    {
      id: "p_volta_09",
      slug: "everyday-tee-cloud",
      title: "Everyday Tee — Cloud",
      description:
        "Supima cotton with a touch of stretch. Cut longer in the back, tagless, and dyed with a white that stays white.",
      details: "",
      price: 38,
      images: [u("photo-1521572163474-6864f9cf17ab"), u("photo-1576566588028-4147f3842f27")],
      categoryId: "cat_apparel",
      variantGroup: {
        label: "Size",
        variants: [
          { id: "v1", name: "S", stock: 30 },
          { id: "v2", name: "M", stock: 41 },
          { id: "v3", name: "L", stock: 28 },
          { id: "v4", name: "XL", stock: 12 },
        ],
      },
      inventory: 111,
      sku: "VLT-ET-CLD",
      status: "active",
      createdAt: "2026-05-02T10:00:00Z",
    },
    {
      id: "p_volta_10",
      slug: "track-cap-black",
      title: "Track Cap — Black",
      description:
        "Five panels, brushed cotton, and an adjustable strap that doesn't dig. Embroidered bolt on the side, nothing on the front.",
      details: "",
      price: 32,
      images: [u("photo-1588850561407-ed78c282e89b"), u("photo-1575428652377-a2d80e2277fc")],
      categoryId: "cat_accessories",
      inventory: 58,
      sku: "VLT-TC-BLK",
      status: "active",
      createdAt: "2026-04-15T10:00:00Z",
    },
    {
      id: "p_volta_11",
      slug: "transit-backpack",
      title: "Transit Backpack",
      description:
        "22 liters, weatherproof zips, a laptop sleeve that floats off the bottom, and a hidden passport pocket. One bag for the gym, the office, and the weekend.",
      details: "",
      price: 124,
      compareAt: 140,
      images: [u("photo-1553062407-98eeb64c6a62"), u("photo-1622560480605-d83c853bc5c3")],
      categoryId: "cat_accessories",
      inventory: 19,
      sku: "VLT-TB-001",
      status: "active",
      createdAt: "2026-08-28T10:00:00Z",
    },
    {
      id: "p_volta_12",
      slug: "studio-sock-3-pack",
      title: "Studio Sock — 3-Pack",
      description:
        "Cushioned where you land, mesh where you sweat. Three pairs: ember, black, cloud.",
      details: "",
      price: 24,
      images: [u("photo-1586350977771-b3b0abd50c82"), u("photo-1582966772680-860e372bb558")],
      categoryId: "cat_accessories",
      inventory: 96,
      sku: "VLT-SS-3PK",
      status: "active",
      createdAt: "2026-03-20T10:00:00Z",
    },
    {
      id: "p_volta_13",
      slug: "circuit-runner-2-prototype",
      title: "Circuit Runner 2 (Prototype)",
      description:
        "Next season's flagship. Carbon-plated, 40g lighter, not ready for the world yet.",
      details: "",
      price: 189,
      images: [u("photo-1579338559194-a162d19bf842")],
      categoryId: "cat_sneakers",
      inventory: 0,
      sku: "VLT-CR2-PRO",
      status: "draft",
      createdAt: "2026-09-29T10:00:00Z",
    },
  ],
};

/* ------------------------------------------------------------------ */
/* ODE — skincare                                                      */
/* ------------------------------------------------------------------ */

export const odeStore: Store = {
  id: "store_ode",
  name: "ODE Skin",
  slug: "ode",
  logoText: "ODE",
  tagline: "Skincare, slowed down",
  contactEmail: "care@odeskin.com",
  phone: "+1 (503) 555-0142",
  address: "114 NW Couch St, Portland, OR 97209",
  hours: "Tue–Sun 11am–6pm",
  currency: "USD",
  shippingNote: "Complimentary shipping over $50. 60-day returns, opened or not.",
  theme: {
    brandColor: "#4d5f4a",
    fontPairing: "editorial",
    announcement: "Complimentary shipping on orders over $50",
    heroImage: u("photo-1556228453-efd6c1ff04f6", 2400),
    heroHeadline: "Three steps. Nothing you don't need.",
    heroSub: "Clinically-dosed botanicals in exactly the amounts your skin can use — made fresh monthly in Portland.",
    heroCta: "Shop rituals",
    storyImage: u("photo-1616394584738-fc6e612e71b9", 1800),
    storyTitle: "Formulated by a chemist who got tired of 12-step routines",
    storyBody:
      "ODE exists because our founder, a cosmetic chemist for fifteen years, kept watching brands add steps instead of results. We make eight products, total. Each one is made in small monthly batches, dated like good food, and dosed at clinical levels — because an ingredient list is a promise, not a mood board.",
    footerText: "ODE Skin · Made fresh monthly in Portland, Oregon.",
    sections: [
      { id: "hero", enabled: true },
      { id: "collections", enabled: true },
      { id: "carousel", enabled: true },
      { id: "story", enabled: true },
      { id: "trust", enabled: true },
      { id: "newsletter", enabled: true },
    ],
    socials: { instagram: "odeskin", tiktok: "odeskin" },
  },
  categories: [
    { id: "cat_cleanse", name: "Cleanse", slug: "cleanse", image: u("photo-1556228720-195a672e8a03", 1200) },
    { id: "cat_treat", name: "Treat", slug: "treat", image: u("photo-1620916566398-39f1143ab7be", 1200) },
    { id: "cat_moisturize", name: "Moisturize", slug: "moisturize", image: u("photo-1598440947619-2c35fc9aa908", 1200) },
  ],
  products: [
    {
      id: "p_ode_01",
      slug: "morning-oat-cleanser",
      title: "Morning Oat Cleanser",
      description:
        "A pH-balanced gel that cleans without the squeak. Colloidal oat calms, glycerin holds water in, and the whole thing rinses in one pass. Your face, minus the day — nothing else removed.",
      details: "",
      price: 28,
      images: [u("photo-1556228720-195a672e8a03"), u("photo-1608248543803-ba4f8c70ae0b")],
      categoryId: "cat_cleanse",
      variantGroup: {
        label: "Size",
        variants: [
          { id: "v1", name: "100ml", stock: 42 },
          { id: "v2", name: "200ml", price: 44, stock: 18 },
        ],
      },
      inventory: 60,
      sku: "ODE-MOC-100",
      status: "active",
      featured: true,
      createdAt: "2026-08-15T10:00:00Z",
    },
    {
      id: "p_ode_02",
      slug: "number-four-serum",
      title: "№4 Barrier Serum",
      description:
        "Our bestseller. 5% niacinamide, ceramides in the ratio skin actually uses, and zero fragrance. Eight weeks of daily use measurably thickens the moisture barrier — we ran the study twice to be sure.",
      details: "",
      price: 52,
      compareAt: 62,
      images: [u("photo-1620916566398-39f1143ab7be"), u("photo-1625772452859-1c03d5bf1137")],
      categoryId: "cat_treat",
      variantGroup: {
        label: "Size",
        variants: [
          { id: "v1", name: "30ml", stock: 35 },
          { id: "v2", name: "50ml", price: 76, stock: 12 },
        ],
      },
      inventory: 47,
      sku: "ODE-N4S-30",
      status: "active",
      featured: true,
      createdAt: "2026-09-01T10:00:00Z",
    },
    {
      id: "p_ode_03",
      slug: "cloud-cream",
      title: "Cloud Cream",
      description:
        "A whipped moisturizer that disappears in four seconds flat. Squalane and shea without the wait, in a glass jar you'll refill, not replace.",
      details: "",
      price: 46,
      images: [u("photo-1598440947619-2c35fc9aa908"), u("photo-1611930022073-b7a4ba5fcccd")],
      categoryId: "cat_moisturize",
      variantGroup: {
        label: "Size",
        variants: [
          { id: "v1", name: "50ml", stock: 28 },
          { id: "v2", name: "Refill pod", price: 38, stock: 40 },
        ],
      },
      inventory: 68,
      sku: "ODE-CLC-50",
      status: "active",
      featured: true,
      createdAt: "2026-07-22T10:00:00Z",
    },
    {
      id: "p_ode_04",
      slug: "quiet-retinal-night",
      title: "Quiet Retinal — Night",
      description:
        "0.1% retinaldehyde buffered in squalane, for results without the flaking chapter. Start twice a week; your future self will write you a thank-you note.",
      details: "",
      price: 64,
      images: [u("photo-1612817288484-6f916006741a"), u("photo-1617897903246-719242758050")],
      categoryId: "cat_treat",
      inventory: 31,
      sku: "ODE-QRN-30",
      status: "active",
      featured: true,
      createdAt: "2026-09-18T10:00:00Z",
    },
    {
      id: "p_ode_05",
      slug: "second-cleanse-balm",
      title: "Second Cleanse Balm",
      description:
        "Sorbet-textured balm that melts sunscreen and makeup on contact, then emulsifies milky. The satisfying one.",
      details: "",
      price: 34,
      images: [u("photo-1570172619644-dfd03ed5d881"), u("photo-1571781926291-c477ebfd024b")],
      categoryId: "cat_cleanse",
      inventory: 54,
      sku: "ODE-SCB-90",
      status: "active",
      createdAt: "2026-06-30T10:00:00Z",
    },
    {
      id: "p_ode_06",
      slug: "glass-mist",
      title: "Glass Mist",
      description:
        "Five weights of hyaluronic acid in a mist fine enough to use over makeup. The bottle lives on your desk; your skin drinks all day.",
      details: "",
      price: 30,
      images: [u("photo-1631729371254-42c2892f0e6e"), u("photo-1629198688000-71f23e745b6e")],
      categoryId: "cat_treat",
      inventory: 72,
      sku: "ODE-GLM-80",
      status: "active",
      createdAt: "2026-05-25T10:00:00Z",
    },
    {
      id: "p_ode_07",
      slug: "overnight-mask",
      title: "Overnight Repair Mask",
      description:
        "A sleeping mask with 10% urea and panthenol. Wake up to the skin you had before the flight, the deadline, the winter.",
      details: "",
      price: 48,
      compareAt: 56,
      images: [u("photo-1596462502278-27bfdc403348"), u("photo-1556228578-8c89e6adf883")],
      categoryId: "cat_moisturize",
      inventory: 26,
      sku: "ODE-ORM-75",
      status: "active",
      createdAt: "2026-08-02T10:00:00Z",
    },
    {
      id: "p_ode_08",
      slug: "daily-veil-spf",
      title: "Daily Veil SPF 40",
      description:
        "A mineral-hybrid sunscreen with no cast on any skin tone — we checked on forty volunteers, not four. Doubles as a gripping primer.",
      details: "",
      price: 38,
      images: [u("photo-1556760544-74068565f05c"), u("photo-1570554886111-e80fcca6a029")],
      categoryId: "cat_moisturize",
      variantGroup: {
        label: "Finish",
        variants: [
          { id: "v1", name: "Invisible", stock: 44 },
          { id: "v2", name: "Soft tint", stock: 21 },
        ],
      },
      inventory: 65,
      sku: "ODE-DVS-50",
      status: "active",
      createdAt: "2026-09-12T10:00:00Z",
    },
    {
      id: "p_ode_09",
      slug: "eye-concentrate",
      title: "Eye Concentrate",
      description:
        "Caffeine for the morning, peptides for the long game. A ceramic tip keeps it cool without the fridge.",
      details: "",
      price: 42,
      images: [u("photo-1512496015851-a90fb38ba796"), u("photo-1552046122-03184de85e08")],
      categoryId: "cat_treat",
      inventory: 38,
      sku: "ODE-EYC-15",
      status: "active",
      createdAt: "2026-07-08T10:00:00Z",
    },
    {
      id: "p_ode_10",
      slug: "hand-ritual-duo",
      title: "Hand Ritual Duo",
      description:
        "Wash and cream, scented with vetiver and fig leaf. The pair that makes guests ask about your bathroom.",
      details: "",
      price: 36,
      images: [u("photo-1598452963314-b09f397a5c48"), u("photo-1585232004423-244e0e6904e3")],
      categoryId: "cat_cleanse",
      inventory: 49,
      sku: "ODE-HRD-01",
      status: "active",
      createdAt: "2026-04-28T10:00:00Z",
    },
    {
      id: "p_ode_11",
      slug: "the-full-ritual",
      title: "The Full Ritual",
      description:
        "All eight products, boxed, at fifteen percent off. The complete routine for people who want to stop thinking about routines.",
      details: "",
      price: 248,
      compareAt: 292,
      images: [u("photo-1571781926291-c477ebfd024b"), u("photo-1608248543803-ba4f8c70ae0b")],
      categoryId: "cat_moisturize",
      inventory: 14,
      sku: "ODE-SET-ALL",
      status: "active",
      createdAt: "2026-09-20T10:00:00Z",
    },
    {
      id: "p_ode_12",
      slug: "travel-ritual-kit",
      title: "Travel Ritual Kit",
      description:
        "Cleanser, serum, and cream in carry-on sizes, zipped into a washable linen pouch.",
      details: "",
      price: 58,
      images: [u("photo-1616394584738-fc6e612e71b9"), u("photo-1556228720-195a672e8a03")],
      categoryId: "cat_cleanse",
      inventory: 33,
      sku: "ODE-TRK-01",
      status: "active",
      createdAt: "2026-06-10T10:00:00Z",
    },
    {
      id: "p_ode_13",
      slug: "vitamin-c-morning",
      title: "Bright Morning Vitamin C",
      description:
        "15% ethylated ascorbic acid — the stable kind. In testing now, launching next season.",
      details: "",
      price: 58,
      images: [u("photo-1620916566398-39f1143ab7be")],
      categoryId: "cat_treat",
      inventory: 0,
      sku: "ODE-BMC-30",
      status: "draft",
      createdAt: "2026-09-30T10:00:00Z",
    },
  ],
};

export const stores: Store[] = [voltaStore, odeStore];

export function getStore(slug: string): Store | undefined {
  return stores.find((s) => s.slug === slug);
}

/** The store the dashboard is "logged in" as while the UI is mock-driven. */
export const currentStore = voltaStore;

/* ------------------------------------------------------------------ */
/* Dashboard data (VOLTA's business)                                   */
/* ------------------------------------------------------------------ */

export const customers: Customer[] = [
  { id: "c_01", name: "Maya Okafor", email: "maya.okafor@gmail.com", location: "Brooklyn, NY", ordersCount: 4, totalSpent: 512, firstOrderAt: "2026-04-11T00:00:00Z" },
  { id: "c_02", name: "Daniel Reyes", email: "dreyes91@outlook.com", location: "Austin, TX", ordersCount: 2, totalSpent: 296, firstOrderAt: "2026-06-02T00:00:00Z" },
  { id: "c_03", name: "Sofia Lindqvist", email: "sofia.lq@proton.me", location: "Seattle, WA", ordersCount: 6, totalSpent: 874, firstOrderAt: "2026-02-19T00:00:00Z" },
  { id: "c_04", name: "Jordan Park", email: "jordan.park@gmail.com", location: "Chicago, IL", ordersCount: 1, totalSpent: 148, firstOrderAt: "2026-09-28T00:00:00Z" },
  { id: "c_05", name: "Amara Diallo", email: "amara.d@yahoo.com", location: "Atlanta, GA", ordersCount: 3, totalSpent: 402, firstOrderAt: "2026-05-14T00:00:00Z" },
  { id: "c_06", name: "Tom Becker", email: "t.becker@gmx.de", location: "Denver, CO", ordersCount: 2, totalSpent: 212, firstOrderAt: "2026-07-21T00:00:00Z" },
  { id: "c_07", name: "Priya Natarajan", email: "priya.nat@gmail.com", location: "San Jose, CA", ordersCount: 5, totalSpent: 689, firstOrderAt: "2026-03-05T00:00:00Z" },
  { id: "c_08", name: "Liam Gallagher", email: "liam.g.main@icloud.com", location: "Portland, OR", ordersCount: 1, totalSpent: 88, firstOrderAt: "2026-10-01T00:00:00Z" },
];

const img = (id: string) => u(id, 300);

export const orders: Order[] = [
  {
    id: "o_1042", number: "#1042", customerId: "c_04", customerName: "Jordan Park", customerEmail: "jordan.park@gmail.com",
    items: [{ productId: "p_volta_01", title: "Circuit Runner — Ember", image: img("photo-1542291026-7eec264c27ff"), variant: "US 10", quantity: 1, price: 148 }],
    total: 148, status: "paid", createdAt: "2026-10-06T08:42:00Z", shippingAddress: "1510 N Damen Ave, Chicago, IL 60622",
  },
  {
    id: "o_1041", number: "#1041", customerId: "c_03", customerName: "Sofia Lindqvist", customerEmail: "sofia.lq@proton.me",
    items: [
      { productId: "p_volta_08", title: "Heavyweight Hoodie — Ash", image: img("photo-1556821840-3a63f95609a7"), variant: "M", quantity: 1, price: 88 },
      { productId: "p_volta_12", title: "Studio Sock — 3-Pack", image: img("photo-1586350977771-b3b0abd50c82"), quantity: 2, price: 24 },
    ],
    total: 136, status: "paid", createdAt: "2026-10-05T19:15:00Z", shippingAddress: "4021 Stone Way N, Seattle, WA 98103",
  },
  {
    id: "o_1040", number: "#1040", customerId: "c_01", customerName: "Maya Okafor", customerEmail: "maya.okafor@gmail.com",
    items: [{ productId: "p_volta_05", title: "Volt High — Citrus", image: img("photo-1560769629-975ec94e6a86"), variant: "US 9", quantity: 1, price: 172 }],
    total: 172, status: "fulfilled", createdAt: "2026-10-05T11:03:00Z", shippingAddress: "233 Greene Ave, Brooklyn, NY 11238",
  },
  {
    id: "o_1039", number: "#1039", customerId: "c_07", customerName: "Priya Natarajan", customerEmail: "priya.nat@gmail.com",
    items: [
      { productId: "p_volta_02", title: "Court Classic — White", image: img("photo-1595950653106-6c9ebd614d3a"), variant: "US 8", quantity: 1, price: 118 },
      { productId: "p_volta_09", title: "Everyday Tee — Cloud", image: img("photo-1521572163474-6864f9cf17ab"), variant: "M", quantity: 2, price: 38 },
    ],
    total: 194, status: "shipped", createdAt: "2026-10-04T16:48:00Z", shippingAddress: "88 S 4th St, San Jose, CA 95112",
  },
  {
    id: "o_1038", number: "#1038", customerId: "c_05", customerName: "Amara Diallo", customerEmail: "amara.d@yahoo.com",
    items: [{ productId: "p_volta_11", title: "Transit Backpack", image: img("photo-1553062407-98eeb64c6a62"), quantity: 1, price: 124 }],
    total: 124, status: "shipped", createdAt: "2026-10-03T09:27:00Z", shippingAddress: "671 Edgewood Ave SE, Atlanta, GA 30312",
  },
  {
    id: "o_1037", number: "#1037", customerId: "c_08", customerName: "Liam Gallagher", customerEmail: "liam.g.main@icloud.com",
    items: [{ productId: "p_volta_08", title: "Heavyweight Hoodie — Ash", image: img("photo-1556821840-3a63f95609a7"), variant: "L", quantity: 1, price: 88 }],
    total: 88, status: "fulfilled", createdAt: "2026-10-02T14:12:00Z", shippingAddress: "2134 SE Division St, Portland, OR 97202",
  },
  {
    id: "o_1036", number: "#1036", customerId: "c_02", customerName: "Daniel Reyes", customerEmail: "dreyes91@outlook.com",
    items: [
      { productId: "p_volta_03", title: "Apex Trail — Storm", image: img("photo-1606107557195-0e29a4b5b4aa"), variant: "US 11", quantity: 1, price: 164 },
      { productId: "p_volta_10", title: "Track Cap — Black", image: img("photo-1588850561407-ed78c282e89b"), quantity: 1, price: 32 },
    ],
    total: 196, status: "shipped", createdAt: "2026-10-01T20:55:00Z", shippingAddress: "1804 E 6th St, Austin, TX 78702",
  },
  {
    id: "o_1035", number: "#1035", customerId: "c_06", customerName: "Tom Becker", customerEmail: "t.becker@gmx.de",
    items: [{ productId: "p_volta_04", title: "Midnight Runner — Black", image: img("photo-1512374382149-233c42b6a83b"), variant: "US 11", quantity: 1, price: 152 }],
    total: 152, status: "cancelled", createdAt: "2026-09-30T10:31:00Z", shippingAddress: "950 Lincoln St, Denver, CO 80203",
  },
  {
    id: "o_1034", number: "#1034", customerId: "c_03", customerName: "Sofia Lindqvist", customerEmail: "sofia.lq@proton.me",
    items: [{ productId: "p_volta_01", title: "Circuit Runner — Ember", image: img("photo-1542291026-7eec264c27ff"), variant: "US 8", quantity: 1, price: 148 }],
    total: 148, status: "fulfilled", createdAt: "2026-09-29T13:08:00Z", shippingAddress: "4021 Stone Way N, Seattle, WA 98103",
  },
  {
    id: "o_1033", number: "#1033", customerId: "c_01", customerName: "Maya Okafor", customerEmail: "maya.okafor@gmail.com",
    items: [
      { productId: "p_volta_06", title: "Aurora Low — Rose", image: img("photo-1603808033192-082d6919d3e1"), variant: "US 7", quantity: 1, price: 126 },
      { productId: "p_volta_12", title: "Studio Sock — 3-Pack", image: img("photo-1586350977771-b3b0abd50c82"), quantity: 1, price: 24 },
    ],
    total: 150, status: "fulfilled", createdAt: "2026-09-28T17:40:00Z", shippingAddress: "233 Greene Ave, Brooklyn, NY 11238",
  },
];

export const messages: ContactMessage[] = [
  {
    id: "m_01", name: "Jordan Park", email: "jordan.park@gmail.com", subject: "Sizing question on the Circuit Runner",
    body: "Hey! I'm usually a 9.5 in most brands — do the Circuit Runners run big or small? Debating between the 9 and the 10 before my order ships. Thanks!",
    createdAt: "2026-10-06T07:58:00Z", read: false,
  },
  {
    id: "m_02", name: "Renata Silva", email: "renata.silva.photo@gmail.com", subject: "Wholesale inquiry",
    body: "Hi VOLTA team — I run a boutique in Miami's Design District and we'd love to stock the Court Classic line. Could you send over your wholesale terms?",
    createdAt: "2026-10-05T15:22:00Z", read: false,
  },
  {
    id: "m_03", name: "Tom Becker", email: "t.becker@gmx.de", subject: "Cancelled order refund timing",
    body: "I cancelled order #1035 yesterday — just checking how long the refund takes to land back on my card. No rush, just want to make sure it went through.",
    createdAt: "2026-10-01T09:14:00Z", read: true,
  },
  {
    id: "m_04", name: "Aisha Mahmoud", email: "aisha.m@studio-nour.com", subject: "Collab idea: run club edition",
    body: "Love what you're building. I organize a 400-member run club in LA and we're looking for a shoe partner for our spring race series. Open to a limited colorway collab?",
    createdAt: "2026-09-28T19:03:00Z", read: true,
  },
  {
    id: "m_05", name: "Chris Dupont", email: "c.dupont@fastmail.com", subject: "Restock date for US 11 Ember?",
    body: "The US 11 Circuit Runner in Ember has been sold out for two weeks. Any idea when it's coming back? Happy to join a waitlist if you have one.",
    createdAt: "2026-09-26T12:47:00Z", read: true,
  },
];

/** Last 30 days of revenue for the dashboard chart (ends today). */
export const revenueSeries: { date: string; revenue: number; orders: number }[] = [
  { date: "Sep 7", revenue: 212, orders: 2 }, { date: "Sep 8", revenue: 388, orders: 3 },
  { date: "Sep 9", revenue: 148, orders: 1 }, { date: "Sep 10", revenue: 524, orders: 4 },
  { date: "Sep 11", revenue: 296, orders: 2 }, { date: "Sep 12", revenue: 176, orders: 2 },
  { date: "Sep 13", revenue: 612, orders: 5 }, { date: "Sep 14", revenue: 440, orders: 3 },
  { date: "Sep 15", revenue: 232, orders: 2 }, { date: "Sep 16", revenue: 98, orders: 1 },
  { date: "Sep 17", revenue: 364, orders: 3 }, { date: "Sep 18", revenue: 512, orders: 4 },
  { date: "Sep 19", revenue: 286, orders: 2 }, { date: "Sep 20", revenue: 648, orders: 5 },
  { date: "Sep 21", revenue: 390, orders: 3 }, { date: "Sep 22", revenue: 174, orders: 1 },
  { date: "Sep 23", revenue: 452, orders: 4 }, { date: "Sep 24", revenue: 318, orders: 2 },
  { date: "Sep 25", revenue: 560, orders: 4 }, { date: "Sep 26", revenue: 410, orders: 3 },
  { date: "Sep 27", revenue: 238, orders: 2 }, { date: "Sep 28", revenue: 496, orders: 4 },
  { date: "Sep 29", revenue: 342, orders: 3 }, { date: "Sep 30", revenue: 352, orders: 3 },
  { date: "Oct 1", revenue: 396, orders: 3 }, { date: "Oct 2", revenue: 488, orders: 4 },
  { date: "Oct 3", revenue: 324, orders: 2 }, { date: "Oct 4", revenue: 494, orders: 4 },
  { date: "Oct 5", revenue: 608, orders: 5 }, { date: "Oct 6", revenue: 448, orders: 3 },
];
