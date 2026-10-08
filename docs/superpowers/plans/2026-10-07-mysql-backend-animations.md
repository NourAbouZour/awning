# Awning MySQL Backend + Animations — Implementation Plan

> **For agentic workers:** Implement task-by-task. This is NOT a git repo, so
> "commit" steps are replaced by a verification gate (`npm run build` and/or
> `npx vitest run`). Steps use checkbox (`- [ ]`) syntax.

**Goal:** Give the UI-complete Awning app a real MySQL backend (administered
via phpMyAdmin) with email/password auth, and add tasteful reduced-motion-aware
animations.

**Architecture:** Backend lives inside Next.js — Prisma/MySQL + a data-access
layer returning existing `types.ts` shapes + server actions for mutations.
Auth is bcrypt + a `jose` JWT cookie. Animations via framer-motion wrappers.

**Tech Stack:** Next.js 16, React 19, Prisma (mysql), bcryptjs, jose,
framer-motion@14, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-07-mysql-backend-animations-design.md`

## Global Constraints

- Next.js is 16.3.8 — read `node_modules/next/dist/docs/01-app` guides for
  server actions, middleware, data fetching BEFORE writing server code.
- Data-layer functions MUST return the existing `src/lib/types.ts` shapes;
  money fields are `number` (convert Prisma Decimal).
- All animations MUST short-circuit to static when `useReducedMotion()` is true.
- Prisma provider is `mysql`; `DATABASE_URL="mysql://root:@localhost:3306/awning"`.
- Keep the `next dev` agent block in AGENTS.md intact.

## Review Focus

- **Unauthenticated access to `/dashboard`** → middleware redirects to `/login`.
- **Login with wrong password / unknown email** → friendly error, no session.
- **Checkout when inventory is low/zero** → order still records; inventory not
  driven negative (clamp at 0).
- **Store slug that does not exist** (`/s/unknown`) → 404 via `notFound()`.
- **Duplicate email on signup** → friendly "email already in use", no 500.

---

## Phase 0 — Database foundation

### Task 1: Dependencies, env, Prisma client singleton

**Files:**
- Modify: `package.json` (deps + `prisma.seed` + scripts)
- Create: `.env`
- Create: `src/lib/db.ts`

- [ ] Read `node_modules/next/dist/docs/01-app` relevant guides.
- [ ] Install: `npm i @prisma/client bcryptjs jose` and
  `npm i -D prisma @types/bcryptjs vitest @vitejs/plugin-react vite-tsconfig-paths`
- [ ] `npx prisma init --datasource-provider mysql` (creates `prisma/schema.prisma`).
- [ ] Create `.env` with `DATABASE_URL`, generated `AUTH_SECRET`
  (`openssl rand -base64 32`), and the `NEXT_PUBLIC_*` vars from `.env.example`.
- [ ] `src/lib/db.ts`: Prisma singleton guarded against dev hot-reload:

```ts
import { PrismaClient } from "@prisma/client";
const g = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = g.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") g.prisma = prisma;
```

- [ ] Verify: `npx prisma validate` — expect no datasource error (schema still empty of models is fine after Task 2).

### Task 2: Prisma schema

**Files:** Modify: `prisma/schema.prisma`

- [ ] Define models per spec: User, Store, StoreTheme, Category, Product,
  ProductVariant, Customer, Order, OrderItem, ContactMessage with the enums
  `ProductStatus { active draft }` and `OrderStatus { paid fulfilled shipped cancelled }`.
  JSON for `StoreTheme.sections` and `Product.images`. Decimal(10,2) for money.
  Composite uniques: `@@unique([storeId, slug])` on Category & Product,
  `@@unique([storeId, email])` on Customer, `@@unique([storeId, number])` on Order.
  `onDelete: Cascade` from Store to children; OrderItem.productId `onDelete: SetNull`.
- [ ] Verify: `npx prisma validate` → "The schema is valid".

### Task 3: Migrate + generate

- [ ] Ensure WAMP MySQL is running (port 3306). Create DB if needed:
  `CREATE DATABASE IF NOT EXISTS awning;` (phpMyAdmin or CLI).
- [ ] `npx prisma migrate dev --name init`
- [ ] Verify: tables exist (`npx prisma studio` or phpMyAdmin shows them).
- [ ] Fallback if MySQL 9.1 errors: point `DATABASE_URL` at WAMP MariaDB, re-run.

### Task 4: Seed from mock data

**Files:** Create: `prisma/seed.ts`

- [ ] Import `stores`, `orders`, `customers`, `messages` from `src/lib/mock-data`.
  For each store: create User (email `${slug}@demo.test`, password `awning123`
  hashed), Store, StoreTheme (map theme incl. sections JSON + socials),
  Categories, Products (+ variants from `variantGroup`). Then Customers,
  Orders (+ OrderItems). Use a fixed password so the user can log in.
- [ ] Add to package.json: `"prisma": { "seed": "node --import tsx prisma/seed.ts" }`
  (install `tsx` dev dep) — or compile via ts-node; prefer `tsx`.
- [ ] `npx prisma db seed`
- [ ] Verify: row counts match mock data; print demo credentials.

---

## Phase 1 — Auth

### Task 5: Auth library (TDD)

**Files:** Create: `src/lib/auth.ts`, `src/lib/auth.test.ts`

**Produces:** `hashPassword(pw): Promise<string>`,
`verifyPassword(pw, hash): Promise<boolean>`,
`createSession(userId): Promise<void>` (sets cookie),
`readSession(): Promise<{userId:string}|null>`, `destroySession(): Promise<void>`,
`getCurrentUser(): Promise<User|null>`, `getCurrentStore()`.

- [ ] **Step 1 (test):** hash/verify roundtrip + wrong password fails:

```ts
import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "./auth";
describe("password", () => {
  it("verifies a correct password and rejects a wrong one", async () => {
    const h = await hashPassword("awning123");
    expect(await verifyPassword("awning123", h)).toBe(true);
    expect(await verifyPassword("nope", h)).toBe(false);
  });
});
```

- [ ] **Step 2:** `npx vitest run src/lib/auth.test.ts` → FAIL (not implemented).
- [ ] **Step 3:** Implement bcryptjs hash/verify; session via `jose`
  `SignJWT`/`jwtVerify` (HS256, secret from `AUTH_SECRET`), cookie
  `awning_session`, httpOnly, sameSite lax, 30d, via `next/headers` `cookies()`.
  `getCurrentUser` reads session → `prisma.user.findUnique`.
- [ ] **Step 4:** `npx vitest run src/lib/auth.test.ts` → PASS.

### Task 6: Middleware

**Files:** Create: `src/middleware.ts`

- [ ] Guard `/dashboard/:path*` and `/onboarding`: no valid session → redirect
  `/login`. On `/login`,`/signup` with session → redirect `/dashboard`.
  Use edge-safe `jwtVerify` (jose works on edge). `matcher` config exported.
- [ ] Verify: `npm run build` passes; manual — visiting `/dashboard` logged out
  redirects to `/login`.

### Task 7: Auth actions + wire forms

**Files:** Create `src/app/(auth)/actions.ts`; Modify login & signup form
components and `src/components/dashboard/sidebar.tsx` (logout).

- [ ] `signup(formData)`: validate, reject duplicate email (friendly), create
  user, session, redirect `/onboarding`. `login(formData)`: verify, friendly
  error on failure, redirect `/dashboard` or `/onboarding`. `logout()`.
- [ ] Wire the existing login/signup screens to call these actions (replace the
  simulated submit). Add logout to sidebar.
- [ ] Verify: `npm run build`; manual login with seeded `volta@demo.test`/`awning123`.

---

## Phase 2 — Data-access layer

### Task 8: Server data functions + adapters (TDD on adapters)

**Files:** Create `src/server/adapters.ts`, `src/server/stores.ts`,
`src/server/products.ts`, `src/server/orders.ts`, `src/server/customers.ts`,
`src/server/messages.ts`; Create `src/server/adapters.test.ts`.

**Produces (consumed by all wiring tasks):**
- `getStoreBySlug(slug): Promise<Store|null>` (full store w/ theme, categories, products)
- `getStoreForUser(userId): Promise<Store|null>`
- `listStores(): Promise<Store[]>`
- `getProduct(storeId, slug|id)`, `listProducts(storeId)`
- `listOrders(storeId)`, `getOrder(storeId, id)`
- `listCustomers(storeId)` (with computed ordersCount/totalSpent)
- `listMessages(storeId)`
- `getRevenueSeries(storeId)`
- Adapters: `toProduct(row)`, `toOrder(row)`, `toStore(row)`, etc. — Decimal→number, JSON parse.

- [ ] **Step 1 (test):** adapter converts Decimal + JSON correctly, e.g.
  `toProduct` returns `price: number`, `images: string[]`, `status` union.
  (Use plain objects shaped like Prisma rows — no DB needed.)
- [ ] **Step 2:** `npx vitest run src/server/adapters.test.ts` → FAIL.
- [ ] **Step 3:** Implement adapters + query functions (Prisma `include` for
  relations; compute customer totals via `prisma.order` aggregate or in-memory).
- [ ] **Step 4:** tests PASS. `npm run build`.

---

## Phase 3 — Wire dashboard (scoped to current user's store)

### Task 9: Dashboard pages → real data

**Files (Modify):** `src/app/dashboard/page.tsx`, `orders/page.tsx`,
`orders/[id]/page.tsx`, `products/page.tsx`, `products/[id]/page.tsx`,
`categories/page.tsx`, `customers/page.tsx`, `messages/page.tsx`,
`design/page.tsx`, `settings/page.tsx`; `components/dashboard/revenue-chart.tsx`,
`sidebar.tsx`, `product-form.tsx`.

- [ ] Replace `import { ... } from "@/lib/mock-data"` with
  `const store = await getStoreForUser(user.id)` (+ redirect to `/onboarding`
  if null) and the matching `src/server/*` calls scoped to `store.id`.
- [ ] Pass data into client components as props (revenue-chart, product-form,
  sidebar get store name/links).
- [ ] Verify after each page: `npm run build`.

### Task 10: Dashboard mutations (server actions)

**Files:** Create `src/app/dashboard/products/actions.ts`,
`src/app/dashboard/design/actions.ts`, `src/app/dashboard/settings/actions.ts`,
`src/app/dashboard/orders/actions.ts`, `src/app/dashboard/messages/actions.ts`.

- [ ] `createProduct`/`updateProduct`/`deleteProduct` (scoped to store, revalidate).
  `saveTheme` (design page). `saveSettings`. `updateOrderStatus`.
  `markMessageRead`. All verify the row belongs to the current user's store.
- [ ] Wire the existing forms/buttons to these actions (replace simulated submits).
- [ ] Verify: `npm run build`; manual — edit a product, see it persist + in phpMyAdmin.

---

## Phase 4 — Wire storefront + checkout

### Task 11: Storefront pages → real data

**Files (Modify):** `src/app/s/[store]/layout.tsx`, `page.tsx`,
`product/[slug]/page.tsx`, `contact/page.tsx`, `order-confirmed/page.tsx`.

- [ ] `getStoreBySlug(params.store)`; `notFound()` when null. Product page by slug.
- [ ] Contact form → server action creating a ContactMessage.
- [ ] Verify: `npm run build`; `/s/volta` and `/s/ode` render as before.

### Task 12: Checkout (place order)

**Files:** Create `src/app/s/[store]/actions.ts`; Modify cart drawer / checkout
component and `order-confirmed/page.tsx`.

- [ ] `placeOrder(storeSlug, lines, customer, shippingAddress)`: in a
  `prisma.$transaction` — upsert Customer (by store+email), generate order
  `number` (e.g. `#1001` sequence per store), create Order + OrderItems from
  current product/variant prices, decrement inventory clamped at 0, return the
  order number. Redirect to `/s/[store]/order-confirmed?order=<number>`.
- [ ] order-confirmed reads the order by number and shows a real summary.
- [ ] Verify: place an order on `/s/volta`; it appears in dashboard orders and
  in phpMyAdmin; inventory decremented.

---

## Phase 5 — Wire onboarding + marketing

### Task 13: Onboarding wizard → create store

**Files (Modify):** onboarding page/wizard; Create
`src/app/onboarding/actions.ts`.

- [ ] `createStore(wizardData)` for the current user: create Store + StoreTheme
  (+ a couple of starter Categories), reject if user already has a store or slug
  taken (friendly), redirect `/dashboard`. Wire the wizard's final step.
- [ ] Verify: signup → wizard → dashboard shows the new (empty) store.

### Task 14: Marketing landing store previews → DB

**Files (Modify):** `src/app/(marketing)/page.tsx`.

- [ ] Replace mock store previews with `listStores()` (or featured subset).
- [ ] Verify: `npm run build`.

---

## Phase 6 — Animations

### Task 15: Motion primitives

**Files:** Create `src/components/ui/motion.tsx`.

- [ ] `Reveal` (opacity/translateY in on `whileInView`, `viewport={{once:true}}`),
  `Stagger`+`StaggerItem`, `AnimatedNumber` (framer `useSpring`/`animate`
  count-up). Each returns static markup when `useReducedMotion()` is true.
  `"use client"`.
- [ ] Verify: `npm run build`.

### Task 16: Apply animations

**Files (Modify):** marketing landing sections, `src/app/template.tsx` (create —
route transition), storefront home sections + product grid, product cards,
dashboard home stat cards (Stagger + AnimatedNumber), primary button hover.

- [ ] Wrap sections in `Reveal`, product grids in `Stagger`, stat numbers in
  `AnimatedNumber`. Add `template.tsx` fade/slide page transition. Subtle
  `whileHover` lift on product cards.
- [ ] Verify: `npm run build`; manual — scroll landing + storefront, numbers
  count up on dashboard, reduced-motion OS setting disables motion.

---

## Phase 7 — Verification

### Task 17: Full verification pass

- [ ] `npx vitest run` → all green.
- [ ] `npm run build` → success, no type errors.
- [ ] Manual smoke (browser): signup → onboarding → dashboard CRUD →
  storefront → checkout → order visible in dashboard + phpMyAdmin.
- [ ] Confirm reduced-motion respected and no console errors.
