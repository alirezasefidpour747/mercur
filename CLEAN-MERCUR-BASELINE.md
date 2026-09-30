# CLEAN-MERCUR-BASELINE.md

## 1. Native capabilities present

This is a source audit of the supplied fork, not proof that its runtime works.

| Area | Native implementation and evidence |
|---|---|
| Monorepo | Bun workspaces and Turborepo: `apps/*`, `packages/*`, `packages/providers/*`, integration and E2E workspaces. Root `package.json`, `turbo.json`. |
| Backend | `apps/api`: Medusa application using `withMercur`; `packages/core`: marketplace plugin. Declared Medusa packages/overrides: **2.21.0**. Mercur: **2.3.6-canary.6**. |
| Frontend/Admin/Vendor | React/Vite dashboard libraries in `packages/admin`, `packages/vendor`; hosts in `apps/admin-test` (dev 7001) and `apps/vendor` (dev 7002). API config disables embedded dashboard serving. The README's scaffold URLs do not describe these host settings. |
| Storefront | `apps/storefront`: Next.js **15.5.24**, React 19; existing B2C catalog, product detail, cart and checkout. This is not yet the restricted Didar B2B frontend. |
| Mercur modules | Seller, Offer, Product Attribute, Product Edit, Review, Commission, Payout, Promotion Cost, Media, Custom Fields, Admin UI, Vendor UI and Codegen under `packages/core/src/modules`. |
| Product/Variant | Medusa Product/Variant, category hierarchy, images/options and catalog APIs; Mercur attributes and product review/change workflows. Native Offer requires `product_id` and `variant_id`: keep a minimal native Variant under each initial Didar Product instead of inventing another SKU hierarchy. |
| Seller/Vendor | Seller, Member, SellerMember and invitations. SellerMember carries `role_id` and owner flag. Membership is checked against authenticated actor plus seller context, including client-provided `x-seller-id`. |
| Supplier Offers | Native Offer holds seller/product/variant IDs, SKU, inventory/backorder flags and lead time; links to prices, inventory and shipping profile. Multiple sellers can offer the same Product/Variant. This is the preferred reuse candidate. |
| Cart/Order | Medusa cart/order plus Mercur `completeCartWithSplitOrdersWorkflow`, OrderGroup, seller order links and line-item Offer links. Checkout creates seller orders and reservations; it is not the Didar request/proforma acceptance workflow. |
| Inventory | Native inventory items, levels, reservations and stock locations; seller inventory/location links and Offer inventory links. Quantity inventory is not UID-level physical-piece identity. |
| Fulfillment | Native shipping profiles, options, fulfillment sets/service zones; Mercur seller-scoped fulfillment creation/cancellation. Does not establish Didar package/UID/invoice/OTP custody semantics. |
| Auth | Medusa auth with user/customer/member actors; vendor session/bearer authentication and seller membership checks. Mercur permission catalog, route guards and resolver interface exist. Without a configured permission resolver, `resolvePermissionsMiddleware` grants all catalog permissions and marks enforcement false. |
| API routes | File-based `route.ts` and middleware/query/validator files. Existing families: `/admin/products`, `/admin/offers`, `/admin/sellers`, `/vendor/products`, `/vendor/offers`, `/store/products`, `/store/offers`, `/store/carts/:id/complete`, `/store/order-groups`; native Medusa commerce/auth routes also participate. |
| Database/Migrations | PostgreSQL; Medusa DML/services and MikroORM module migrations, plus declarative cross-module links. Checked-in Mercur migrations reside under each module's `migrations`. Use Medusa migration/link tooling; no hand-maintained parallel commerce schema. |
| Redis | API config selects Redis cache, event bus, workflow engine and locking providers. Redis and PostgreSQL are runtime prerequisites. |
| Seed | `apps/api` script `seed` runs `medusa exec ./src/scripts/seed.ts`: marketplace demo sellers, catalog, offers, regions, stock and shipping setup. It is not the P01 Didar seed. |
| Tests | Jest/SWC unit and HTTP integration suites in `integration-tests`; app-specific Jest scripts; Playwright E2E and guide suites in `e2e-tests`. CI uses Bun 1.3.8, Node 20, PostgreSQL 15 and Redis 7. |

Primary source evidence: the paths above, `packages/core/src/links`, `packages/core/src/api/utils/ensure-seller-middleware.ts`, `packages/core/src/api/utils/permissions-middleware.ts`, and `.github/workflows/integration-tests.yml`.

## 2. Specifications that can build on native capabilities

| Specification | Native foundation; remaining Didar boundary |
|---|---|
| PRODUCT-CORE | Category hierarchy, Product/Variant, Seller, Offer, attributes, review and dashboards. Add gold/commercial fields, reporting history and restricted B2B projections. |
| B2B-RBAC / AUTH-OTP-SECURITY | Existing authentication, seller membership and permission extension points. Add enforceable Didar roles, retailer organization membership/scope and resource-specific OTP security. |
| PHYSICAL-INTAKE / SUPPLY-ORDER | Reuse stable Product/Variant/Seller references; these business processes need dedicated records. |
| PACKAGING-FULFILLMENT / DISPATCH-DELIVERY | Reuse fulfillment/shipping primitives where their meaning fits; add invoice manifest, physical packages, tracking and custody workflow. |
| WAREHOUSE-INVENTORY | Native inventory/location/reservation can underpin the optional future package. It remains **Optional / Deferred**, never an automatic prerequisite. |
| AGENT-OPERATIONS | Reuse actor/auth and product/order references; agent bags, assignments, custody and authorized sales need Didar records. |
| SETTLEMENT-CORE / INVOICE-BILLING | Reuse native commerce references; native currency payments/payouts do not provide the authoritative 18K-gold ledger or UID-linked invoices. |
| NOTIFICATION | Reuse Medusa notification/provider and event patterns after configuration; SMS/in-app delivery and OTP behavior need explicit implementation. |
| REPORTING-FOUNDATION | Stable IDs/links and timestamps exist; required organization/actor context, append-oriented audit and status history need additions. |

Read: MASTER-B2B-FLOW and MD-INDEX dated 2026-09-30, REPORTING-FOUNDATION current file version 3, PRODUCT-CORE current file version 2.

The Master and Product specification reference ORDER-CORE, but MD-INDEX and the numbered execution list omit an Order Core package. Before scheduling request/proforma/supply integration: **OWNER DECISION REQUIRED** on its package position. This does not prevent isolated P01 after the baseline gate passes.

## 3. Where extensions are required

- Preserve native Product and Offer identity. Prefer linked, structured extensions for karat/product code, supplier weight ranges, making-fee basis/ranges, internal availability and actor context. Evaluate native Custom Fields against migration/query/validation requirements before choosing it; do not put report-critical relationships only in free-form metadata.
- Add allowlisted retailer catalog DTOs and server-side restrictions on discovery, expansions, caches and exports. Existing `store/offers/query-config.ts` exposes seller identity and stocked quantity, and Product defaults include metadata/variants. Adding a safe new screen alone does not secure the old routes.
- Reuse native review/change workflows where compatible, while preserving Didar approval/publication meaning and auditable transitions. The product-request feature flag affects permitted vendor statuses; its required configuration must be verified.
- Add organization-aware queries and mutations. Seller membership is a useful base; it is not proof of the full DIDAR/SUPPLIER/RETAILER scope or Agent assignment rules.
- Extend frontend catalog actions to Product-and-quantity requests, with real API error states. Do not retain native supplier selection or immediate-stock checkout semantics.
- Add structured status/audit history and query filters at the required reporting grain. Native timestamps and ProductChange actions alone do not demonstrate compliance with REPORTING-FOUNDATION.

## 4. Where custom modules are required

Proposed domain boundaries, subject to each package's implementation map:

- Organization/membership and Didar permission resolver where native seller/customer identity is insufficient.
- Physical Intake and Physical Item/UID traceability.
- Supply Order and supplier commercial/payment-term snapshots.
- Order request, internal supply allocations, versioned proforma and retailer acceptance gate.
- Packaging and dispatch/custody extensions that preserve Package → Physical Item and Shipment → 1..N same-retailer Invoices.
- Agent bags, authorized retailers, custody and direct-sale context.
- Settlement Policy, separate supplier/retailer obligations and append-oriented 18K-gold ledger; balance calculated from entries.
- Invoice/Invoice Line → physical UID and immutable commercial history.
- Shared audit/status-history capability where native history is insufficient.

Do not implement these domains together now. Full WMS, Shelf/Bin/Cycle Count, B2C and optional packaging-material inventory remain deferred.

## 5. Core areas that should remain untouched

Keep `packages/core`, native Medusa tables/services, generic authentication, checkout and framework tooling unchanged for Didar business features. Prefer application modules, links, workflows/hooks, scoped APIs and dashboard extension points.

Native upstream patch files already exist in this clean commit:
`@medusajs+core-flows@2.18.0.patch` and `@medusajs+core-flows@2.21.0-payment-hooks.patch`.
They are part of official Mercur, not imports from the old Didar project. Do not add old-project patches or disable these native patches to conceal a failure.

Do not run stock-reserving native checkout before retailer acceptance. Do not turn supplier cost terms into customer terms, mutate historical transactions from live Offer reads, equate quantity inventory with physical UIDs, or substitute manually editable balances for a ledger.

## 6. Unchanged build and run status

**Baseline status: IN PROGRESS. Build/Run gate: TESTED — FAILED. P01: NOT STARTED.**

| Identity | Observed value |
|---|---|
| Supplied repository | https://github.com/alirezasefidpour747/mercur |
| Branch audited | main |
| Commit | 296b5968eac620d3cb689ae130a6a2aa382c9941 |
| Official upstream main | Same SHA, verified with `git ls-remote https://github.com/mercurjs/mercur.git refs/heads/main` |
| Initial working tree | Clean |
| Execution environment | Node 24.19.0; declared Bun 1.3.8 installed separately for verification |
| Application edits | None; this report is documentation only |

| Check | Status | Actual evidence |
|---|---|---|
| Locked installation | TESTED — FAILED | Frozen install through the configured proxy stalled after resolving/downloading/extracting 106 entries. The final retry (network concurrency 4, fresh metadata) timed out at 180 seconds, exit 124. Direct registry access was also unavailable. No completed node_modules installation. |
| Root `bun run build` | TESTED — FAILED | Exit 127: `turbo: command not found`. This is an installation/environment failure, not a demonstrated source compile error. |
| API `bun run --cwd apps/api medusa build` | TESTED — FAILED | Exit 1: `Script not found "medusa"` while dependencies are unavailable. |
| Storefront `bun run --cwd apps/storefront build` | TESTED — FAILED | Exit 127: `next: command not found`. |
| Root `bun run dev` | TESTED — FAILED | Exit 127: `turbo: command not found`; no application server started. |
| PostgreSQL/Redis setup | NOT STARTED | docker, postgres, psql and redis-server executables are absent in this workspace; no service/database endpoint supplied. |
| Migrations, seed, real API, persistence/restart and page refresh | NOT STARTED | Cannot verify before dependencies and actual PostgreSQL/Redis runtime are available. |
| Unit/integration/E2E tests | NOT STARTED | Test runner dependencies/runtime prerequisites not installed. |

Root commands are `bun install --frozen-lockfile`, `bun run build`, `bun run dev`, `bun run test:unit` and `bun run test:integration:http`. The root Turbo build is not the whole application gate: `apps/api`, `apps/admin-test` and `apps/vendor` have no build script, so explicit API build and host Vite builds are also required. Storefront `next.config.ts` sets `typescript.ignoreBuildErrors = true`; a successful Next build alone would not establish a clean typecheck.

Next verification, without feature edits: complete frozen installation; provision isolated PostgreSQL/Redis and development environment values; build packages/API/dashboard hosts/storefront; apply native migrations; run native seed against disposable data; test health/catalog/auth, server restart and direct page refresh. Record exact results before starting P01. No lockfile changes, dependency downgrades, source fixes or old-project workarounds have been used.
