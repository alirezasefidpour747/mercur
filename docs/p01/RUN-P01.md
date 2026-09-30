# P01 verification commands

P01 status is **TESTED — FAILED**. These commands describe the remaining native verification; they are not evidence that it passed.

Use the approved clean Mercur environment, Bun 1.3.8, PostgreSQL and Redis. Restore the checked-in lockfile with `bun install --frozen-lockfile`. Configure the API's actual database, Redis, CORS and authentication settings. Configure its native Store default currency; P01 does not assign a making-fee cash unit. The application keeps the native default shipping-profile identity without creating stock or a delivery promise.

From the repository root:

```sh
bun run build
bun run --cwd apps/api build
bun run --cwd apps/storefront build
bun run --cwd apps/admin-test build
bun run --cwd apps/admin-test typecheck
bun run --cwd apps/vendor build
bun run --cwd apps/vendor typecheck
bunx tsc --noEmit -p apps/storefront/tsconfig.json
```

In `apps/api`, apply native and application migrations and synchronize the registered links with the native Medusa migration command:

```sh
bunx medusa db:migrate
bun run seed:p01
bun run dev
```

Set `P01_SEED_PASSWORD` to a non-production fixture password of at least 12 characters before seeding. The seed logs the native publishable key. Set `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` and `MEDUSA_BACKEND_URL` on the Storefront. Set `VITE_MERCUR_BACKEND_URL` on both dashboard hosts. Start the Storefront and both hosts with their existing dev commands.

Fixture accounts are `p01.ops@example.test`, `p01.supplier1@example.test` through `p01.supplier3@example.test`, `p01.retailer1@example.test`, `p01.retailer2@example.test`, and `p01.no-product-permission@example.test`. They use native auth identities and persisted Didar membership/grants. Seed fixtures are for an isolated verification database, not production onboarding.

Run the unit/schema tests from `apps/api`:

```sh
bun run test:p01:unit
bun run test:p01:schema
```

For the real HTTP suite, supply `P01_API_URL`, `P01_SEED_PASSWORD`, `P01_PUBLISHABLE_KEY` and the same actual `DATABASE_URL` as Medusa, then run:

```sh
bun run test:p01:integration
```

It fails if the native runtime is unavailable. It includes actual native Product/Variant/Offer SQL assertions; it does not inject Product data or mock HTTP responses. It does not yet cover every T01–T10 case, including crash/fault injection and the authenticated UI matrix.

From `e2e-tests`, install the configured Playwright browser and run the separate failure-state suite:

```sh
bunx playwright install chromium
bunx playwright test --config playwright.p01-failure.config.ts
```

The suite starts real UI dev servers and points them at an intentionally stopped backend on port 9019. It does not mock responses. It tests language/direction, viewports, real error states and direct refresh only. `P01_CHROME_PATH` can select an existing Chrome executable. Passing this suite does not satisfy the complete authenticated P01 journey or T10.

Entrypoints:

- Storefront: `/{fa|en|ar|fr}/products`, `/categories`, `/products/:handle`.
- Product Ops host: `/{lang}/ops/product-reviews`, `/product-reviews/:id`, `/products`, `/products/:id`, `/supplier-offers`, `/product-reports`.
- Supplier host: `/{lang}/supplier/products`, `/products/new`, `/products/:id`, `/supplier-offers`.

Before marking P01 PASSED, complete the approved T01–T10 plan against native PostgreSQL/Medusa, including real migrations/seed replay, the full authenticated journey, permission/bypass tests, concurrency/failure recovery, all filters/reports, restart persistence and the complete authenticated screen matrix. Do not begin P02.
