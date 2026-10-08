# SDD ledger — plan: docs/superpowers/plans/2026-10-07-mysql-backend-animations.md
Note: NOT a git repo — no worktree/commits; verification gate = npm run build / npx vitest run.
Pre-flight: shared interfaces = Task 8 server/* consumed by Tasks 9-14; Task 5 auth consumed by 6,7,9-14. Checked: names align (getStoreForUser, getStoreBySlug, placeOrder). Clean.
Task 1: Ruling: pin Prisma 6 (not installed 7.10) — Prisma 7 needs driver adapters + new client generator/ESM; Prisma 6 classic matches schema/plan and is reliable on local MySQL — cost if wrong: isolated major-version bump later.
Task 1: Ruling: use Next 16 proxy.ts (not middleware.ts) — middleware renamed to proxy in Next 16 — cost if wrong: file rename.
Task 1: complete (deps pinned Prisma6+tsx+vitest2, .env, db.ts, prisma generate OK)
Task 2: complete (schema.prisma, prisma validate OK)
Task 5: complete (password.ts+session.ts+auth.ts; password.test.ts 1/1 RED->GREEN)
Task 6: complete (proxy.ts route guard)
Task 8: complete (server/adapters+stores+products+orders+customers+messages; adapters.test.ts 4/4 RED->GREEN; tsc clean)
Task 4: complete-code (prisma/seed.ts written; run deferred until MySQL up)
Task 7: complete (auth actions login/signup/logout; login+signup pages wired; removed fake Google buttons)
Task 9: complete (dashboard layout+sidebar+all pages wired to server/* scoped by store; tsc clean)
Task 10: complete (product/category/design/settings/messages/orders actions; forms wired; images->paste-URL; reply->mailto)
Task 11: complete (storefront layout/home/product/contact/order-confirmed wired to getStoreBySlug; dynamic rendering; image guards)
Task 12: complete (placeOrder txn: order+items+customer upsert+inventory clamp; cart-drawer checkout details form; order-confirmed shows real number)
Task 13: complete (onboarding createStore action + wired go-live; real success links)
Task 14: complete (marketing landing reads listStores; guards for <2 stores / empty hero)
Task 15: complete (motion.tsx Reveal/Stagger/StaggerItem/AnimatedNumber; reduced-motion aware)
Task 16: complete (template.tsx route fade; dashboard stat stagger+countup; storefront reveals; shop grid stagger; marketing reveals/stagger; product-card hover lift)
BUILD: npm run build PASSED (Next 16.3.8, 21 routes, data routes dynamic, proxy registered)
TESTS: vitest 5/5 pass; tsc clean

=== DB brought up + migrate/seed (Tasks 3,4 run) ===
Task 3: complete (started wamp mysqld 9.1.0 directly; CREATE DATABASE awning; prisma migrate dev --name init applied)
Task 4: complete (seed run: 2 users, 2 stores, 26 products, 10 orders, 8 customers, 5 messages; fixed variant-id PK collision by letting Prisma gen variant ids; fixed prisma.seed cmd to npx tsx)
SMOKE: curl on prod build (3001): / 200, /login 200, /s/volta 200, /s/ode 200, /s/volta/shop 200, /s/nope 404, /dashboard ->307 /login (proxy guard), VOLTA content renders from DB.
DB INTEGRITY: products 13/store, variant products have groups+variants w/ non-zero inv, orders scoped w/ Decimal totals, 0 orphan order items, customers scoped (volta 8/ode 0), users have $2b$ bcrypt hashes.

=== Final review (fresh subagent, opus) + fix pass ===
Final: fixed #1 variant products forced inventory=0 -> set inventory = sum(variant stock) in create/update (products/actions.ts) -> storefront sold-out correct; verified build+tsc+DB shows non-zero variant inventory.
Final: fixed #2 onboarding uploaded(blob) product image -> empty images -> next/image crash: onboarding action falls back to PLACEHOLDER_IMAGE; guarded ProductCard + ProductGallery empty src. Verified build+tsc.
Final: fixed #3 placeOrder unhandled throw / order-number race: wrapped in try/catch returning {error}, retry up to 5 on P2002; extracted nextOrderNumber to pure module. TEST order-number.test.ts RED->GREEN; suite 8/8.
Final: fixed #4 customer email case mismatch -> lowercased email in placeOrder upsert/create/order. Verified build+tsc.
Final: fixed #6 signup duplicate-email race -> catch P2002 -> friendly error. Verified build+tsc.
Final: fixed #5 revenue series UTC bucketing -> local-date keys in getRevenueSeries. Verified build+tsc.
Final: fixed #7 toStore missing-theme guard -> storefront page uses (store.theme.sections ?? []). Verified build+tsc.
Final: Ruling: #8 requireCurrentStore redirects unauth caller to /onboarding not /login — correct in effect (proxy bounces /onboarding->/login for no session); left as-is — cost if wrong: one extra redirect hop. 
VERIFY POST-FIX: npm run build PASSED; tsc clean; vitest 8/8.
