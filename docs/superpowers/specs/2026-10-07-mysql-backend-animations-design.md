# Awning — MySQL Backend (phpMyAdmin) + Frontend Animations

**Date:** 2026-10-07
**Status:** Approved for implementation

## Intent

The Awning app (Next.js 16 / React 19 multi-tenant e-commerce platform) is
UI-complete and driven entirely by `src/lib/mock-data.ts`. This phase gives it
a real backend on the user's local WAMP stack: a **MySQL** database
administered through **phpMyAdmin**, with the Next.js app as the backend
(server components, server actions). It also adds tasteful scroll/entrance
animations to the frontend.

Decisions (user-approved):
- **Scope:** Core slice — DB + data layer + email/password auth + wire the
  whole app (dashboard CRUD, storefront, checkout persisting real orders).
  No real Stripe / cloud uploads / transactional email this phase.
- **Data layer:** Prisma ORM, `mysql` provider.
- **Auth:** email + password (`bcryptjs`), signed httpOnly cookie session
  (`jose`). Fully offline.
- **Animations:** tasteful & polished, always gated by `prefers-reduced-motion`.
- **Tests:** light Vitest unit coverage on pure logic (adapters, auth, money
  math) + `npm run build` gate + manual smoke.

## Architecture

phpMyAdmin is only the admin UI for MySQL; there is no PHP backend. Layers:

1. **Prisma + MySQL** — `prisma/schema.prisma`, migrations, generated client.
   Singleton in `src/lib/db.ts`.
2. **Data-access layer** — `src/server/*.ts` async functions returning the
   SAME shapes as `src/lib/types.ts`, so the ~19 mock-data consumers migrate
   mechanically. Adapters map Prisma rows (Decimal, JSON) → existing types.
3. **Server Actions** — all mutations (`src/app/**/actions.ts`): signup, login,
   logout, onboarding create-store, product create/update/delete, theme save,
   settings save, place-order, mark-message-read, order status update.

Tenant scoping: every merchant-owned row carries `storeId`; dashboard queries
are scoped to the logged-in user's store. Storefront (`/s/[store]`) is public,
keyed by store slug.

## Schema (Prisma models → MySQL tables)

- **User**: id, email (unique), passwordHash, name, createdAt. 1:1 Store.
- **Store**: id, userId (unique FK), name, slug (unique), logoText, logoUrl?,
  tagline, contactEmail, phone, address, hours, currency, shippingNote,
  createdAt.
- **StoreTheme**: 1:1 Store. brandColor, fontPairing, announcement, heroImage,
  heroHeadline, heroSub, heroCta, storyImage, storyTitle, storyBody,
  footerText, instagram?, tiktok?, twitter?, sections (JSON — ordered
  HomeSection[]).
- **Category**: id, storeId FK, name, slug, image. (slug unique per store)
- **Product**: id, storeId FK, slug, title, description, details,
  price (Decimal(10,2)), compareAt? (Decimal), categoryId FK, images (JSON
  string[]), inventory (Int), sku, status (enum: active|draft),
  featured (Bool), variantGroupLabel?, createdAt. (slug unique per store)
- **ProductVariant**: id, productId FK, name, price? (Decimal), stock (Int).
- **Customer**: id, storeId FK, name, email, location, firstOrderAt.
  (email unique per store). `ordersCount`/`totalSpent` are NOT stored —
  computed by query.
- **Order**: id, storeId FK, number (unique per store), customerId FK,
  customerName, customerEmail, total (Decimal), status (enum:
  paid|fulfilled|shipped|cancelled), shippingAddress, createdAt.
- **OrderItem**: id, orderId FK, productId? FK (SetNull on delete), title,
  image, variant?, quantity (Int), price (Decimal).
- **ContactMessage**: id, storeId FK, name, email, subject, body, read (Bool),
  createdAt.

Money is stored as Decimal and converted to `number` in adapters (UI uses
plain numbers today).

## Auth

- `src/lib/auth.ts`: `hashPassword`/`verifyPassword` (bcryptjs),
  `createSession`/`readSession`/`destroySession` (jose HS256 JWT in an
  httpOnly, sameSite=lax cookie `awning_session`, 30-day expiry), `getCurrentUser`.
- `src/middleware.ts`: redirect unauthenticated requests for `/dashboard/**`
  and `/onboarding` to `/login`; redirect authenticated users away from
  `/login` and `/signup`.
- Signup action creates User (no store yet) → redirect `/onboarding`.
  Onboarding completion creates Store + StoreTheme + seed categories for that
  user → redirect `/dashboard`. Login verifies credentials → redirect
  `/dashboard` (or `/onboarding` if no store yet).

## Wiring

Server-component pages `await` the data layer. Client components receive data
as props and call server actions. Specific consumers:
- Dashboard pages (home, orders, products, customers, messages, design,
  settings) → scoped to current user's store.
- Storefront pages (`/s/[store]` layout, home, product, contact,
  order-confirmed) → by slug, public.
- `product-form.tsx` → create/update via action. `revenue-chart.tsx`,
  `sidebar.tsx` → fed real data/store. Marketing landing store previews →
  from DB.
- Checkout: cart is client state; "Place order" server action creates
  Order + OrderItems, upserts Customer, decrements inventory in a transaction,
  redirects to order-confirmed with the created order number.

## Seed

`prisma/seed.ts` loads existing mock data (VOLTA + ODE stores and their
categories, products, orders, customers, messages) into MySQL and creates two
demo merchant users with a known password (printed by the seed). App looks
identical after wiring; credentials available for testing.

## Animations (framer-motion@14, reduced-motion aware)

`src/components/ui/motion.tsx`: `Reveal` (fade/slide on scroll via
`whileInView`), `Stagger`/`StaggerItem`, `AnimatedNumber` (count-up).
All short-circuit to static when `useReducedMotion()` is true.
Applied to: marketing hero + sections, storefront sections, product grids
(stagger), dashboard stat cards (stagger + count-up), route transitions
(`template.tsx`), hover lift on product cards and primary buttons.

## Verification

- `npm run build` passes (type-checks all files) — hard gate.
- `prisma migrate dev` + `prisma db seed` succeed; row counts verified.
- Vitest units: auth hash/verify roundtrip, Decimal→number adapter, derived
  customer totals, order-number generation.
- Manual smoke: signup → onboarding → dashboard CRUD → storefront →
  checkout → order visible in dashboard and in phpMyAdmin.

## Dependencies & prerequisites

Add: `prisma` (dev), `@prisma/client`, `bcryptjs`, `@types/bcryptjs` (dev),
`jose`, `vitest` + `@vitejs/plugin-react` (dev).
`.env`: `DATABASE_URL="mysql://root:@localhost:3306/awning"`, `AUTH_SECRET`
(generated), plus existing `NEXT_PUBLIC_*`.
**User must start WAMP** (MySQL + phpMyAdmin) before migrate/seed.

## Risks

- MySQL 9.1.0 is newer than Prisma's tested 8.x. Expected to work; fallback is
  WAMP's bundled MariaDB (same `mysql` provider) if migrations misbehave.
- Next.js 16 may differ from training data (per AGENTS.md) — read
  `node_modules/next/dist/docs/01-app` guides for server actions, middleware,
  and data fetching before writing server code.
- Default WAMP MySQL root has an empty password; `.env` reflects that. Adjust
  if the user's install differs.
