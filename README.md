# Awning

A multi-tenant e-commerce platform (think Shopify, scoped down): merchants
sign up, build a store in a five-step wizard, and get a live, branded
storefront — all running on one carefully designed template.

> **Current status: UI phase complete.** Every screen is built and clickable
> with realistic mock data. There is no database, auth, or payment backend
> yet — that's the next phase. Buttons that would hit a server simulate the
> action (loading states, toasts, redirects) so the full product can be
> click-tested end to end.

## What's inside

| Area | Route | What you'll find |
|---|---|---|
| Marketing site | `/` and `/pricing` | Landing page, pricing tiers, FAQ |
| Auth | `/signup`, `/login` | Email + Google sign-in screens (simulated) |
| Onboarding | `/onboarding` | 5-step store-builder wizard with a live preview |
| Merchant dashboard | `/dashboard` | Home, Orders, Products, Collections, Customers, Messages, Store design, Settings |
| Demo storefront 1 | `/s/volta` | VOLTA — loud sneaker brand (orange, heavy type) |
| Demo storefront 2 | `/s/ode` | ODE Skin — calm skincare brand (sage, serif) |

Both storefronts run the **same template**; only their theme (color, fonts,
copy, images) differs. That's the core idea of the product, and it's driven
by CSS variables set per store in `src/lib/store-theme.ts`.

## Run it (for beginners)

1. **Install Node.js** — version 18.18 or newer (22 recommended), from
   [nodejs.org](https://nodejs.org). Check with `node --version`.
2. **Install dependencies** — open a terminal in this folder and run:
   ```bash
   npm install
   ```
3. **Start the app:**
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

That's it for the UI phase — no database or API keys needed. The product
photos load from Unsplash, so you'll want an internet connection.

Useful commands:

```bash
npm run dev     # start in development mode (hot reload)
npm run build   # production build (also type-checks)
npm run start   # serve the production build
npm run lint    # ESLint
```

## Environment variables

Copy `.env.example` to `.env` and fill in values. **None are required
today** — they document what the backend phase (Postgres + Prisma, Auth.js,
Stripe Connect, UploadThing, Resend) will need, so accounts can be set up
ahead of time. Each variable has a comment explaining where to get it.

## Project layout

```
src/
  app/
    (marketing)/        # landing + pricing (platform site)
    (auth)/             # login + signup
    onboarding/         # 5-step wizard with live preview
    dashboard/          # merchant admin (sidebar layout)
    s/[store]/          # the storefront template (one per merchant)
  components/
    ui/                 # shadcn-style primitives (button, dialog, table…)
    marketing/          # platform site pieces (header, store previews)
    dashboard/          # admin pieces (sidebar, product form, chart)
    storefront/         # store pieces (header, cart drawer, product card)
  lib/
    mock-data.ts        # the stand-in database: 2 stores, products, orders…
    types.ts            # types mirroring the future Prisma schema
    fonts.ts            # next/font setup + the 5 merchant font pairings
    store-theme.ts      # theme choices -> CSS variables
    contrast.ts         # auto black/white text on any brand color
```

## Design notes

- **Platform brand ("Awning")**: canvas white, deep awning green
  (`#114b32`), Bricolage Grotesque display type, and a scalloped-awning
  motif. The dashboard is quiet and dense, in the spirit of Linear/Stripe.
- **Storefront theming**: a merchant picks one brand color and one of five
  font pairings. `readableOn()` picks black or white button text
  automatically so contrast always passes; hover shades and wash tints are
  derived from the same color.
- **Accessibility**: semantic landmarks, labeled controls, focus-visible
  rings, `prefers-reduced-motion` respected, WCAG-AA-minded colors.

## Next phases

1. Postgres + Prisma, real auth (Auth.js), per-merchant data scoping + tests
2. Stripe Connect checkout, orders, webhooks, email receipts (Resend)
3. Image uploads (UploadThing), rich text, subdomain routing middleware
4. Wire the dashboard and wizard to the real API
