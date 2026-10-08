# Awning — Superadmin Panel, Plans, Billing & Platform Contact Form

**Date:** 2026-10-08
**Status:** Approved for implementation (pending spec review)

## Intent

Give the platform owner (superadmin) a private admin panel to manage merchants:
see every account, which plan they chose, whether they've paid, read platform
"contact us" messages, change a merchant's plan, mark payment, and
activate/deactivate accounts. Merchants keep using the plan they pick; the
owner handles payment manually (no payment processor) and can suspend
non-payers. Plans gate the product limit (Stall = 5, paid = unlimited).

User-approved decisions:
- **Admin login:** a `superadmin` role; one seeded admin account using
  `nourabouzour325@gmail.com` + temp password `admin12345` (change after login).
  Hidden `/admin` area, superadmin only.
- **Plan limits:** Stall → 5 products; Shopfront/Arcade → unlimited. Payment is
  tracked, not enforced automatically.
- **Deactivate:** blocks dashboard login AND takes the storefront offline
  ("temporarily unavailable"); reactivating restores both.

## Schema (migration required)

Add to **User**:
- `role` enum `UserRole { merchant superadmin }` default `merchant`
- `plan` enum `Plan { stall shopfront arcade }` default `stall`
- `billingPaid` Boolean default `false`
- `active` Boolean default `true`

New model **SupportRequest** (platform "contact us", distinct from per-store
ContactMessage):
- id, name, email, subject, message (Text), handled Boolean default false,
  createdAt

## Roles, auth & enforcement

- `src/lib/plan.ts` gains `Plan` type, `productLimit(plan)` (5 for stall,
  `Infinity` otherwise), `limitReached(count, plan)`. Existing
  FREE_PRODUCT_LIMIT/trial helpers stay.
- `getCurrentUser()` already returns the full user (role, plan, active).
- **Login action:** if `user.active === false` → return friendly
  "Your account is suspended — please contact support." (no session).
- **Dashboard layout:** `getCurrentUser()`; if not active → redirect
  `/login`; (proxy already blocks no-session).
- **Admin area** `/admin/**`: proxy adds `/admin` to protected matcher
  (redirect to `/login` without session); admin layout checks
  `user.role === 'superadmin'` else `notFound()`.
- **Storefront** `/s/[store]`: if the owner's `active === false`, render a
  simple "This store is temporarily unavailable" page instead of the store.

## Admin panel (`/admin`)

Server components, guarded by admin layout. New data layer `src/server/admin.ts`
(all functions assert superadmin via a helper `requireSuperadmin()`):
- `listMerchants()` → each merchant's name, email, store name/slug, plan,
  billingPaid, active, productCount, createdAt.
- `listSupportRequests()`, `adminStats()`.

Pages:
- `/admin` — stats (merchants, paid vs unpaid, plan split) + recent support
  requests.
- `/admin/merchants` — table with per-row actions.
- `/admin/messages` — support requests, mark handled.

Server actions `src/app/admin/actions.ts` (each calls `requireSuperadmin()`):
- `setMerchantPlan(userId, plan)`
- `setBillingPaid(userId, paid)`
- `setAccountActive(userId, active)`
- `markSupportHandled(id)`

## Platform contact form (pricing page)

- New section on `/pricing` with name/email/subject/message.
- Action `submitSupportRequest` (`src/app/(marketing)/pricing/actions.ts`) →
  creates a SupportRequest; success state in a client form component.
- These appear under `/admin/messages`.

## Merchant plan selection

- Dashboard **Settings** gains a "Plan" card: current plan, a selector to
  switch (stall/shopfront/arcade), and a note when on a paid plan and
  `billingPaid` is false ("Payment pending — we'll be in touch").
- Action `setOwnPlan(plan)` updates the current user's plan (billingPaid
  unchanged; admin confirms payment).
- Signup honors `/signup?plan=shopfront` from pricing CTAs (optional nicety).

## Product limit by plan

- `createProduct`/`duplicateProduct` read the current user's plan and use
  `limitReached(count, plan)`; Stall blocks past 5, paid plans never block.
- Products page shows "N / 5 products used" on Stall, "N products" on paid.
- TrialBar: Stall shows trial countdown + 5-product note; paid plans show
  "<Plan> plan" + payment status instead.

## Seed

- Demo users: role merchant, plan stall, active true, billingPaid false.
- Add superadmin: `nourabouzour325@gmail.com`, password `admin12345`,
  role superadmin, no store. Printed by the seed.
- A couple of sample SupportRequests so the admin panel isn't empty.

## Verification

- Vitest: `productLimit`/`limitReached(plan)` rules.
- `tsc` + `npm run build`.
- Smoke: superadmin sees `/admin` (merchant gets 404); change a plan/paid/active
  and see it persist; deactivate → merchant login blocked + storefront
  "unavailable"; reactivate restores; pricing contact form creates a request
  visible in admin.

## Risks

- Edge proxy can't read the DB, so role/active checks live in Node layouts/
  actions (defense in depth there, not in proxy). Acceptable.
- Changing a merchant's plan to Stall while they have >5 products: existing
  products remain; they just can't add more (no destructive trim).
