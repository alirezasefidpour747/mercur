# P01-RESULT.md

**Status: TESTED — FAILED**

P01 application code is written on `didar/p01-product-core`, based on the approved clean-baseline commit `3ad0327b476acb4a183bdb554e30f173784945e5`. It is **not a completed P01**. The authenticated native Database → Backend → API → Frontend journey has not passed. No remaining owner business decision is blocking implementation. P02 was not started.

The owner's successful clean local runtime verification is accepted. The failures below describe this separate execution environment and the checked-in build gates, not a retraction of that baseline verification.

## Scope written

| Area | Source behavior | Status |
|---|---|---|
| Product identity | Native Category/Subcategory, Product, one native Variant, native Seller and native Offer IDs; linked extension records only | IMPLEMENTED — NOT TESTED |
| Supplier authoring | Persisted draft/term revisions, save, Offer creation/editing and submit; ownership derived from authenticated membership | IMPLEMENTED — NOT TESTED |
| Product Ops | Queue/detail, published-versus-candidate comparison, reasons, request changes/reject/approve, separate publish/unpublish and history | IMPLEMENTED — NOT TESTED |
| Retailer catalog | Allowlisted safe DTO, categories, list, SQL filters/count/sort/pagination, detail and approved nullable public indicative terms | IMPLEMENTED — NOT TESTED |
| History and recovery | Immutable candidate/term/event rows, structured actor/org/owner references, version checks, durable command receipts, native Redis resource locking and replay | IMPLEMENTED — NOT TESTED |
| Four-language UI and failure states | `fa/en/ar/fr`, language URL routing, RTL/LTR, local fonts; failure-state subset PASSED, authenticated screens unverified | IMPLEMENTED — NOT TESTED |

No Request Basket, Order, Proforma, Settlement, Invoice, physical UID, Packaging, Dispatch, WMS or B2C feature was added. Future request actions are visibly disabled and call no fake backend. No production Product data or API response is mocked.

## Database and migrations

Added the `didar_catalog` application module and one migration:

`apps/api/src/modules/didar-catalog/migrations/Migration20260930000000.ts`

It defines 14 extension tables/models:

- `didar_organization`, `didar_membership`, `didar_grant`.
- `didar_catalog_profile`, `didar_candidate`, `didar_candidate_attribute`.
- `didar_offer_profile`, `didar_offer_revision`.
- `didar_submission`, `didar_submission_offer`.
- `didar_catalog_event`, `didar_command_receipt`.
- `didar_attribute_approval`, `didar_public_attribute`.

The migration includes uniqueness/filter/search/history indexes, numeric/interval/mode checks, immutable revision/event triggers and Medusa big-number raw-field synchronization. Native Product/Offer links are registered as read-only application links. There is no parallel Product/SKU model.

**Native PostgreSQL application records were not seeded in this environment.** The schema-only PostgreSQL WASM test applied the exact migration, exercised fixture rows/constraints, closed and reopened its persisted database, then applied the down migration. This does not prove native Medusa migration compatibility, native Offer-service persistence or native app restart persistence.

`seed-p01.ts` is written to provision native auth identities and persisted memberships/grants, two Categories, three Subcategories, five Products, three Suppliers, a Product with two Suppliers' differing Offer conditions, a nullable-public-terms Product and a request-changes journey. Durable command replay is used for interrupted seed recovery. Those fixture claims remain unverified against the native runtime; running the seed twice has not been proven here.

## Native capabilities reused

- Mercur native Product creation/default option, Seller association, attributes and Product audit.
- Native Product module service for the single Variant. Source inspection showed the ecommerce Variant workflow creates an empty price-set even without prices; the application adapter avoids that workflow and records a native `VARIANT_ADD` audit with the actual actor.
- Native Offer identity/service with its configured default shipping-profile reference. No invented price, currency, inventory quantity/item/location is passed.
- Native staged ProductChange, confirmation, Product rejection/change-request and staged-change rejection workflows.
- Native email/password auth, user/member/customer identities, Seller membership/context, Medusa UI controls/tables, dashboard host extension routes and Storefront gallery/carousel.
- Native Medusa Redis locking for command serialization; active extension transactions are reused for attribute-approval reads.

**Price-less/inventory-less native Offer persistence and query behavior are not yet proven.** The real HTTP suite includes native SQL assertions for one Variant, multiple Offers and absent price/inventory links, but its runtime preflight failed before those assertions executed.

No Mercur core/dashboard package source or upstream patch was changed.

## API contracts added/changed

| Audience | Application routes | Actual UI consumer |
|---|---|---|
| Retailer | `GET /store/b2b/context`; `GET /store/b2b/catalog/{categories,definitions,facets,products}`; `GET .../products/:id` | Retailer category/list/filter/detail screens through the allowlisted Storefront BFF |
| Supplier | `GET /vendor/b2b/context`; `GET /vendor/b2b/catalog/{categories,definitions,products}` | Draft controls and published-common-Product Offer picker |
| Supplier | `GET/POST /vendor/b2b/products`; `GET/PATCH .../:id`; `POST .../:id/submit` | Supplier Product list, draft/detail and submit controls |
| Supplier | `GET/POST /vendor/b2b/offers`; `GET/PATCH .../:id` | Own Offer list/forms and immutable term edits |
| Didar | `GET /admin/b2b/context`; `GET /admin/b2b/catalog/{categories,definitions}` | Authorized Ops context and Product controls |
| Didar | `GET /admin/b2b/products`; `GET .../:id`; `POST .../:id/unpublish`; `GET /admin/b2b/offers`; `GET .../offers/:id` | Ops Product/Offer list/detail and unpublish controls |
| Didar | `GET /admin/b2b/product-reviews`; `GET .../:id`; `POST .../:id/{request-changes,reject,approve,publish}` | Queue/detail, comparison and actual review commands |
| Didar | `GET /admin/b2b/catalog-events`; `GET /admin/b2b/product-reports` with authorized CSV format | Review history/report view and real CSV export |
| Storefront BFF | `GET /api/b2b/...` allowlisted catalog/context proxy; `POST/DELETE /api/b2b/session` | HTTP-only native auth session and catalog fetches |

These are implemented source contracts; successful native responses have not been demonstrated here. Transport and server failures return actual errors. The BFF does not turn a failed response into catalog data.

Application middleware denies alternate native `/store/*`, `/vendor/*` and `/admin/*` paths for this P01-only app, except the B2B extension routes and necessary native self/Seller-selection operations. Native authentication under `/auth` remains usable. Actual route ordering and all bypass variations still need real native HTTP verification.

## Screens and filters

Storefront uses language routes, not commerce-country/region routing:

- `/{lang}/categories`, `/categories/:category`, `/products`, `/products/:handle`, `/login`.
- Product list uses URL state, actual category/subcategory IDs, weight/percentage-fee intervals, karat, material, Product type, approved native attributes, search and sort.
- Filter/count/sort/pagination predicates execute in SQL before DTO hydration. Null public ranges remain discoverable without range filters.
- Detail uses the safe Product API and reused gallery. It shows no Supplier/Offer split, commercial sourcing terms, exact inventory, UID or stock location.

Product Ops host contains `/{lang}/ops/{products,product-reviews,supplier-offers,product-reports}`, real review detail/actions, separate publication state and immutable published-versus-candidate comparison. Supplier host contains `/{lang}/supplier/products`, `/products/new`, `/products/:id`, `/supplier-offers`, real published-Product lookup and own Offer forms. Published edits are staged; a Supplier with only an Offer on another Supplier's common Product sees common fields read-only.

Internal Product/Offer/review/report filters use structured DB predicates for the implemented UI search, state, Supplier and date dimensions. Report counts use distinct Product/Offer identities. Actual result sets/counts, full filter coverage and authenticated pagination remain unverified.

## Authorization enforcement in source

- Native auth actor type and active native identity must match the API audience.
- Active organization/membership/grants are loaded server-side; Supplier scope must also match native Seller membership/context.
- Client ownership fields are rejected. Forged organization/Supplier contexts fail; other Suppliers' authoring resources are hidden.
- Product Ops actions check their individual Didar Product permission. The native grant-all fallback is not used as Didar authorization.
- Supplier, Ops and Retailer responses are separate. Public DTOs are explicitly allowlisted and native metadata/expansion/filter dimensions are rejected.

Pure permission/payload validation tests passed. Actual authenticated A/B isolation, forged Seller context, Retailer bypass protection and non-mutation under denied commands have not passed native integration tests yet.

## Tests executed and actual results

Evidence files are in `docs/p01/evidence/`; runnable setup is in `docs/p01/RUN-P01.md`.

| Check | Result | Limit |
|---|---|---|
| P01 Bun unit tests | PASSED — 12 tests, 90 assertions | Validation, state machine, hashes and permission predicates; not native integration |
| Checked-in extension migration SQL test | PASSED — 1 test | PostgreSQL WASM engine, 14 tables, numeric/raw fields, immutability, constraints, indexes, distinct count, reopen persistence and down migration; not Medusa/native PostgreSQL |
| Playwright failure-state suite | PASSED — 52 tests | 16 retailer login states, 32 Ops/Supplier stopped-backend states with direct refresh, four real login-503/unauthenticated catalog checks; no HTTP mocks |
| Admin host production bundle | PASSED | JS bundle only; native declaration/typecheck gate is still failed |
| Vendor host production bundle | PASSED | JS bundle only; native declaration/typecheck gate is still failed |
| Scoped P01 Storefront lint | PASSED | New catalog, middleware and BFF routes only |
| Backend build/typecheck | TESTED — FAILED | Errors in existing seed/probe scripts; no final P01 source diagnostic reported |
| Full Storefront build/typecheck | TESTED — FAILED | Existing native commerce lint/type errors; full build is not green |
| Admin/Vendor host typechecks | TESTED — FAILED | Missing native package declarations/generated package resolution and existing native/widget errors |
| Real Medusa HTTP suite | TESTED — FAILED | `ECONNREFUSED 127.0.0.1:9000` at preflight; journey/native DB assertions did not execute |
| Native Medusa migration attempt | TESTED — FAILED | Bootstrap did not complete within the bounded runtime attempt; no native migration/seed evidence |
| Native PostgreSQL prerequisite | TESTED — FAILED | `initdb` refuses this root-only execution environment; no mapped unprivileged server user is available |
| Formatting/diff whitespace check | PASSED | Source hygiene only |

The browser suite initially found a catalog error-response hydration crash; it was corrected and the final run passed 52/52. A category dynamic-route naming conflict introduced by P01 was also corrected. Screenshots/component rendering are not used as completion evidence.

## Approved T01–T10 disposition

| Test plan | Status | Missing evidence |
|---|---|---|
| T01 migrations/seed | TESTED — FAILED | Native migration/link synchronization, complete seed execution and replay |
| T02 native identity/Offer | IMPLEMENTED — NOT TESTED | Actual native Variant/Offer graph/service persistence, no pricing/inventory side effects and adapter rollback |
| T03 filters | IMPLEMENTED — NOT TESTED | Every filter/sort/index/result/count chain against actual native seeded data, combined filters and multi-page dataset |
| T04 authorization/bypasses | IMPLEMENTED — NOT TESTED | Native authenticated scope, all alternate routes and direct manipulation failures |
| T05 full journey | TESTED — FAILED | Runtime preflight failed; complete Supplier → Ops → Retailer journey not executed |
| T06 concurrency/recovery | IMPLEMENTED — NOT TESTED | Multi-session races, fault injection, compensation and crash/replay recovery coverage is incomplete |
| T07 audit/history | IMPLEMENTED — NOT TESTED | Schema immutability passed; actual command actor/org/history and denied-write behavior not proven |
| T08 reports | IMPLEMENTED — NOT TESTED | Real native multi-Offer counts, scoped report filters/export/drill-down |
| T09 builds/runtime/restart | TESTED — FAILED | Full builds/typechecks, native dev API and restart persistence; UI failure/refresh subset passed |
| T10 UI matrix | IMPLEMENTED — NOT TESTED | Authenticated category/list/detail, Supplier draft and Ops queue/detail across all languages/viewports; fonts, keyboard/contrast and populated forms/tables |

## Warnings and remaining gaps

1. P01 must not be marked PASSED or treated as production-ready. The real native happy path and required security/concurrency tests remain unverified.
2. The real HTTP harness is present but does not yet automate every approved case. Fault injection, full compensation checks, native restart orchestration and the authenticated browser journey require completion.
3. Runtime dependencies were restored diagnostically with temporary npm tooling after Bun installation stalled. This is not a verified frozen-lockfile environment. No workaround/dependency source was imported from an older Didar project.
4. Existing core build failed on the native Seller JWT-secret type, and native Admin/Vendor declaration generation reported inference errors. Existing API seed/probe scripts and Storefront commerce components also fail checks. Their source was not modified or excluded to make P01 appear green. The inherited Storefront `ignoreBuildErrors` flag is not counted as verification; independent typechecking failed.
5. Dashboard bundle size/config-loader warnings, native hydration fallback warnings and development native-font serving warnings were observed. The required populated-screen/font/a11y verification remains outstanding.
6. Cross-module native effects are not automatically atomic with extension SQL. Durable receipts/resource locks and publication-last gating are implemented, but real fault/recovery and rollback behavior must be proven. No safety claim is based solely on the unit/schema tests.
7. Final native adapter and authenticated review/forms are source-checked/bundled, but cannot be declared behaviorally verified without the native runtime.

Owner review should use this failed result and the committed source/evidence. No new business mapping decision is requested. P02 remains out of scope.

## Actual files changed

The following exact repository-relative paths are included in this P01 change. Build outputs, temporary tooling, secrets and browser state are not included.

- `P01-IMPLEMENTATION-MAP.md`
- `P01-RESULT.md`
- `apps/admin-test/package.json`
- `apps/admin-test/public/didar-fonts`
- `apps/admin-test/src/routes/[lang]/ops/product-reports/page.tsx`
- `apps/admin-test/src/routes/[lang]/ops/product-reviews/[id]/page.tsx`
- `apps/admin-test/src/routes/[lang]/ops/product-reviews/page.tsx`
- `apps/admin-test/src/routes/[lang]/ops/products/[id]/page.tsx`
- `apps/admin-test/src/routes/[lang]/ops/products/page.tsx`
- `apps/admin-test/src/routes/[lang]/ops/supplier-offers/page.tsx`
- `apps/admin-test/src/routes/page.tsx`
- `apps/api/.mercur/routes.d.ts`
- `apps/api/medusa-config.ts`
- `apps/api/package.json`
- `apps/api/src/api/admin/b2b/catalog-events/route.ts`
- `apps/api/src/api/admin/b2b/catalog/categories/route.ts`
- `apps/api/src/api/admin/b2b/catalog/definitions/route.ts`
- `apps/api/src/api/admin/b2b/context/route.ts`
- `apps/api/src/api/admin/b2b/offers/[id]/route.ts`
- `apps/api/src/api/admin/b2b/offers/route.ts`
- `apps/api/src/api/admin/b2b/product-reports/route.ts`
- `apps/api/src/api/admin/b2b/product-reviews/[id]/approve/route.ts`
- `apps/api/src/api/admin/b2b/product-reviews/[id]/publish/route.ts`
- `apps/api/src/api/admin/b2b/product-reviews/[id]/reject/route.ts`
- `apps/api/src/api/admin/b2b/product-reviews/[id]/request-changes/route.ts`
- `apps/api/src/api/admin/b2b/product-reviews/[id]/route.ts`
- `apps/api/src/api/admin/b2b/product-reviews/route.ts`
- `apps/api/src/api/admin/b2b/products/[id]/route.ts`
- `apps/api/src/api/admin/b2b/products/[id]/unpublish/route.ts`
- `apps/api/src/api/admin/b2b/products/route.ts`
- `apps/api/src/api/b2b/endpoint.ts`
- `apps/api/src/api/middlewares.ts`
- `apps/api/src/api/store/b2b/catalog/categories/route.ts`
- `apps/api/src/api/store/b2b/catalog/definitions/route.ts`
- `apps/api/src/api/store/b2b/catalog/facets/route.ts`
- `apps/api/src/api/store/b2b/catalog/products/[id]/route.ts`
- `apps/api/src/api/store/b2b/catalog/products/route.ts`
- `apps/api/src/api/store/b2b/context/route.ts`
- `apps/api/src/api/vendor/b2b/catalog/categories/route.ts`
- `apps/api/src/api/vendor/b2b/catalog/definitions/route.ts`
- `apps/api/src/api/vendor/b2b/catalog/products/route.ts`
- `apps/api/src/api/vendor/b2b/context/route.ts`
- `apps/api/src/api/vendor/b2b/offers/[id]/route.ts`
- `apps/api/src/api/vendor/b2b/offers/route.ts`
- `apps/api/src/api/vendor/b2b/products/[id]/route.ts`
- `apps/api/src/api/vendor/b2b/products/[id]/submit/route.ts`
- `apps/api/src/api/vendor/b2b/products/route.ts`
- `apps/api/src/links/didar-offer.ts`
- `apps/api/src/links/didar-product.ts`
- `apps/api/src/modules/didar-catalog/__tests__/domain.test.ts`
- `apps/api/src/modules/didar-catalog/authorization.ts`
- `apps/api/src/modules/didar-catalog/commands.ts`
- `apps/api/src/modules/didar-catalog/domain.ts`
- `apps/api/src/modules/didar-catalog/index.ts`
- `apps/api/src/modules/didar-catalog/migrations/Migration20260930000000.ts`
- `apps/api/src/modules/didar-catalog/models/didar_attribute_approval.ts`
- `apps/api/src/modules/didar-catalog/models/didar_candidate.ts`
- `apps/api/src/modules/didar-catalog/models/didar_candidate_attribute.ts`
- `apps/api/src/modules/didar-catalog/models/didar_catalog_event.ts`
- `apps/api/src/modules/didar-catalog/models/didar_catalog_profile.ts`
- `apps/api/src/modules/didar-catalog/models/didar_command_receipt.ts`
- `apps/api/src/modules/didar-catalog/models/didar_grant.ts`
- `apps/api/src/modules/didar-catalog/models/didar_membership.ts`
- `apps/api/src/modules/didar-catalog/models/didar_offer_profile.ts`
- `apps/api/src/modules/didar-catalog/models/didar_offer_revision.ts`
- `apps/api/src/modules/didar-catalog/models/didar_organization.ts`
- `apps/api/src/modules/didar-catalog/models/didar_public_attribute.ts`
- `apps/api/src/modules/didar-catalog/models/didar_submission.ts`
- `apps/api/src/modules/didar-catalog/models/didar_submission_offer.ts`
- `apps/api/src/modules/didar-catalog/models/index.ts`
- `apps/api/src/modules/didar-catalog/native.ts`
- `apps/api/src/modules/didar-catalog/read.ts`
- `apps/api/src/modules/didar-catalog/service.ts`
- `apps/api/src/modules/didar-catalog/write.ts`
- `apps/api/src/scripts/seed-p01.ts`
- `apps/api/tests/p01-http.test.mjs`
- `apps/api/tests/p01-schema.test.mjs`
- `apps/api/tsconfig.json`
- `apps/storefront/public/didar-fonts/IBMPlexSansArabic-OFL.txt`
- `apps/storefront/public/didar-fonts/IBMPlexSansArabic-Regular.ttf`
- `apps/storefront/public/didar-fonts/Inter-OFL.txt`
- `apps/storefront/public/didar-fonts/Inter.ttf`
- `apps/storefront/public/didar-fonts/Vazirmatn-OFL.txt`
- `apps/storefront/public/didar-fonts/Vazirmatn.ttf`
- `apps/storefront/src/app/[locale]/(auth)/layout.tsx`
- `apps/storefront/src/app/[locale]/(auth)/login/page.tsx`
- `apps/storefront/src/app/[locale]/(main)/categories/[category]/page.tsx`
- `apps/storefront/src/app/[locale]/(main)/categories/page.tsx`
- `apps/storefront/src/app/[locale]/(main)/layout.tsx`
- `apps/storefront/src/app/[locale]/(main)/page.tsx`
- `apps/storefront/src/app/[locale]/(main)/products/[handle]/page.tsx`
- `apps/storefront/src/app/[locale]/(main)/products/page.tsx`
- `apps/storefront/src/app/api/b2b/[...path]/route.ts`
- `apps/storefront/src/app/api/b2b/session/route.ts`
- `apps/storefront/src/app/layout.tsx`
- `apps/storefront/src/components/cells/ProductCarousel/ProductCarousel.tsx`
- `apps/storefront/src/components/didar/catalog.tsx`
- `apps/storefront/src/components/molecules/ProductCarouselIndicator/ProductCarouselIndicator.tsx`
- `apps/storefront/src/components/organisms/GalleryCarousel/GalleryCarousel.tsx`
- `apps/storefront/src/components/organisms/ProductGallery/ProductGallery.tsx`
- `apps/storefront/src/middleware.ts`
- `apps/vendor/package.json`
- `apps/vendor/public/didar-fonts`
- `apps/vendor/src/routes/[lang]/supplier/products/[id]/page.tsx`
- `apps/vendor/src/routes/[lang]/supplier/products/new/page.tsx`
- `apps/vendor/src/routes/[lang]/supplier/products/page.tsx`
- `apps/vendor/src/routes/[lang]/supplier/supplier-offers/page.tsx`
- `apps/vendor/src/routes/page.tsx`
- `bun.lock`
- `docs/p01/RUN-P01.md`
- `docs/p01/evidence/admin-build.txt`
- `docs/p01/evidence/admin-typecheck.txt`
- `docs/p01/evidence/api-build.txt`
- `docs/p01/evidence/api-typecheck.txt`
- `docs/p01/evidence/http.txt`
- `docs/p01/evidence/native-migration-attempt.txt`
- `docs/p01/evidence/postgres-prerequisite.txt`
- `docs/p01/evidence/schema.txt`
- `docs/p01/evidence/storefront-build.txt`
- `docs/p01/evidence/storefront-lint.txt`
- `docs/p01/evidence/storefront-typecheck.txt`
- `docs/p01/evidence/ui-failure-states.txt`
- `docs/p01/evidence/unit.txt`
- `docs/p01/evidence/vendor-build.txt`
- `docs/p01/evidence/vendor-typecheck.txt`
- `e2e-tests/p01/failure-states.spec.ts`
- `e2e-tests/playwright.p01-failure.config.ts`
- `shared/p01/messages.ts`
- `shared/p01/styles.css`
- `shared/p01/workspace.tsx`


## Owner-machine debugging — 2026-10-01, round 1

Status: **TESTED — FAILED** (P01 overall).

The owner checked out commit `6680b91a` on macOS with Bun 1.4.2. `bun install --frozen-lockfile` succeeded. `bun run build` in `apps/api` failed with nine TypeScript diagnostics in six existing application seed/probe scripts; route and Medusa type generation succeeded. This independently confirms the recorded backend build failure.

A compatibility correction is **IMPLEMENTED — NOT TESTED** pending the owner's next full build:

- `src/scripts/lib/seed-seller-order.ts`: preserve the graph's nullable string display ID and skip null order entries without non-null assertions.
- `src/scripts/probe-shared-priceset.ts`: pass a string array to the native pricing filter.
- `src/scripts/seed-reservations.ts`: handle nullable inventory levels using inferred graph types.
- `src/scripts/seed-reservations-sole-society.ts`: handle nullable levels/locations and keep the selected location ID separately, rather than manufacture a partial InventoryLevel object.
- `src/scripts/seed-reviews.ts` and `src/scripts/seed-reviews-seller-mercur.ts`: normalize queried customer/order results to the ID-only projection actually consumed by these scripts.

No typecheck exclusion, core package source change, migration, dependency change or seed execution is part of this correction. These existing ecommerce demo scripts are corrected for compilation; they are not enabled as P01 business flows. Full native persistence, authenticated journey and T01–T10 remain pending. P02 remains untouched.


## Owner-machine debugging — 2026-10-01, round 2

Backend `bun run build` on commit `f8a3a1d7` **PASSED**, completing in 4.13 seconds after successful code/type generation. All nine previous script diagnostics were resolved.

Storefront `bun run build` generated its production output, but reported that ESLint could not load the inherited TypeScript config because of old jiti, and explicitly skipped TypeScript validation. This is not evidence of passing lint/typecheck gates.

Correction **IMPLEMENTED — NOT TESTED**: add an application-local `eslint.config.mjs` using the installed Next core-web-vitals and TypeScript lint rules through existing FlatCompat; this avoids the inherited TypeScript config loader without disabling lint or changing dependencies. Set `typescript.ignoreBuildErrors` to false in the application Next config so production build enforces type validation. A new owner-machine build is required; P01 overall remains **TESTED — FAILED** pending remaining gates and the real native journey.


## Owner-machine debugging — 2026-10-01, round 3

Storefront build on `c3a914d3` compiled its bundle but **TESTED — FAILED** at validation: ESLint could not resolve react-hooks from the application placeholder, and Carousel imported a type from a transitive package not declared directly by the app.

Correction **IMPLEMENTED — NOT TESTED**: resolve ESLint plugins relative to the installed Next config, whose declared dependencies include react-hooks; derive Embla API types from the directly installed React hook in both Carousel and ProductCarouselIndicator. No added dependency, lockfile mutation or validation bypass. Next steps are full build and standalone TypeScript diagnostics on the owner's machine.


## Owner-machine debugging — 2026-10-01, round 4

Evidence: `docs/p01/evidence/owner-macos-20261001-storefront-round3.txt` (owner-provided complete build and standalone tsc output).

On `a25179bd`, ESLint loaded successfully and the Embla module errors disappeared. Full storefront build and standalone tsc remain **TESTED — FAILED**. Lint exposes existing native commerce explicit-any/suppression/unsafe-optional-chain errors. Most tsc diagnostics stem from the pre-existing `Routes = Record<string, unknown>` client placeholder, which erases native endpoint methods.

Correction **IMPLEMENTED — NOT TESTED**: bind the native SDK to Mercur's actual exported `@mercurjs/core/_generated` route contract; remove the incompatible optional promotion override in Cart; constrain country selections to strings and filter incomplete country options; make the debounce ref nullable and writable; present absent order amounts as unavailable rather than fabricate zero; describe the optional native seller expansion consumed by the inactive native product component.

These are application compilation fixes only. No native core source, real request behavior, API authorization, dependency lockfile, Didar public DTO or future business feature is added/activated. No lint or TypeScript checks are disabled. Remaining native lint errors are still pending; first re-run standalone tsc to confirm the restored native contract and collect any remaining type diagnostics before the next repair batch. P01 remains **TESTED — FAILED**; backend build has owner-machine passing evidence.


## Owner-machine debugging — 2026-10-01, round 5

Evidence: `docs/p01/evidence/owner-macos-20261001-storefront-round4.txt`.

On `199073cd`, prior storefront SDK/Cart/country/ref diagnostics were resolved, but **TESTED — FAILED**: Mercur's raw generated type map pulled backend source into the frontend compiler, exposing backend decorators and other diagnostics under the frontend tsconfig. One real frontend product-carousel DTO mismatch also remained.

Correction **IMPLEMENTED — NOT TESTED**: an application-local native contract is generated directly from Mercur's checked-in auth/store route sections, with Mercur-relative source imports redirected to the same package's compiled route declarations through its existing exports. The SDK uses this generated contract; no backend implementation is imported into frontend typechecking and no endpoint or response is invented. Build/typecheck scripts regenerate the contract. Both native home-carousel components now accept real StoreProduct DTOs instead of the obsolete presentation Product interface.

Generator executed locally against the exact repository native map and its output matched the checked-in contract. This only verifies contract generation, not full typecheck, runtime or frontend build. No Core source, dependency lockfile or lint/type validation bypass was changed. Remaining lint errors are pending. Owner-machine `bun run typecheck` is required next; P01 remains **TESTED — FAILED**.


## Owner-machine debugging — 2026-10-01, round 6

Storefront `bun run typecheck` on `6d43d3f6` **PASSED**, including native contract regeneration. This supersedes the earlier storefront typecheck failure; storefront lint/full build and positive native journey still remain pending.

Admin evidence: `docs/p01/evidence/owner-macos-20261001-admin-round1.txt`. Admin build and typecheck **TESTED — FAILED**: shared P01 UI had no workspace/package dependency context, so strict Bun resolution could not find React, Medusa UI or Router; the admin sample client also referenced a missing generated API export. The bundle log's asset listing does not override its final failed exit status. The dashboard Medusa-config dynamic-require warning also remains open for runtime verification.

Correction **IMPLEMENTED — NOT TESTED**: register `shared/p01` as the private `@didar/p01-ui` workspace and explicitly declare the same React 18, Router, Medusa UI and React type versions already used by the host apps. Both hosts declare this workspace dependency. Native panel clients use generated auth/admin or auth/vendor contracts pointing at compiled native declarations, following the verified storefront approach; build/typecheck scripts regenerate these declarations. No Core package source, runtime API, business rule or validation gate was changed.

The generator executed against the exact checked-in native map; both outputs matched the checked-in contracts. This is not evidence of passing host builds/typechecks. Because workspace manifests changed, run `bun install` at the repository root on the owner's machine to generate the canonical Bun lockfile. The lockfile update is pending capture/commit from that verified environment; frozen-lockfile verification must be rerun afterward. Do not discard the owner's generated lockfile. Next: admin build/typecheck, then vendor build/typecheck. P01 remains **TESTED — FAILED**; P02 remains untouched.


## Owner-machine debugging — 2026-10-01, round 7

On `2f854894`, `bun install` succeeded and admin typecheck/build both **PASSED**. Evidence: `docs/p01/evidence/owner-macos-20261001-admin-round2.txt`. This supersedes the previous admin compilation failure; admin native-config warning and large bundle warning remain open, and successful compilation is not positive runtime journey evidence.

Vendor production bundle **PASSED** (898ms); vendor typecheck **TESTED — FAILED** with two diagnostics in the existing payment widget. Evidence: `docs/p01/evidence/owner-macos-20261001-vendor-round1.txt`. Both trace to undeclared `@medusajs/types` in the vendor app's own dependency scope.

Correction **IMPLEMENTED — NOT TESTED**: declare `@medusajs/types: 2.21.0` as a vendor devDependency for the widget's type-only import, matching existing native Medusa packages. No payment logic or future package is implemented/activated. Re-run root `bun install` and vendor typecheck. Canonical owner-generated lockfile capture/commit and frozen installation remain pending. Storefront lint/full build, real migrations/seed/API journey, authorization/filter/persistence tests and runtime config warning remain unresolved. Overall P01 remains **TESTED — FAILED**; no P02.


## Owner-machine debugging — 2026-10-01, round 8

On `ec55b323`, root `bun install` succeeded. Vendor typecheck remains **TESTED — FAILED**, now with one TS2367 diagnostic at `order-outstanding-payment.tsx:53`; the dependency-resolution and inferred-parameter errors are resolved. Owner-provided output is recorded in `docs/p01/evidence/owner-macos-20261001-vendor-round2.txt`.

Correction **IMPLEMENTED — NOT TESTED**: the existing widget excludes native Payment Collection status `completed` instead of `captured`, which belongs to Payment Session. Verified against Medusa v2.21.0 `packages/core/types/src/http/payment/common.ts`. The canceled-collection and outstanding-balance guards remain in place. This fixes native application compatibility; it adds no P01 payment capability. Vendor typecheck/build must be rerun on the owner's machine. Canonical lockfile capture, Storefront lint/full build and native T01–T10 evidence remain pending. Overall P01 remains **TESTED — FAILED**.
