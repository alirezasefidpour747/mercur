# MERCUR-UI-BASELINE.md

**Status: IN PROGRESS** — source audit completed for P01 preparation; no UI implementation or browser verification performed.
**Source:** alirezasefidpour747/mercur, native commit `296b5968eac620d3cb689ae130a6a2aa382c9941`; current checkout includes the existing baseline documentation commit `46969fddcae50059b8946b79f4ebf5c3ef323efe`.
**Runtime:** the owner confirmed the clean local runtime now works. This supersedes the earlier environment failure as a prerequisite for preparation; it is not a new runtime test executed here. Preserve CLEAN-MERCUR-BASELINE.md as the earlier evidence record.

## 1. Inputs and scope

Reviewed UI-FOUNDATION, B2B-STOREFRONT-UX, DIDAR-OPERATIONS-CONSOLE, WORK-ADDENDUM-UI, UI-SPEC-INDEX and the supplied Master/MD Index copies. Product and Reporting documents remain at their previously read current file versions 2 and 3. B2B-RBAC was inspected for Product Ops, supplier product entry, retailer catalog, organization scope, workflow-state restrictions and audit boundaries.

The UI specifications describe the eventual platform. P01 includes category/product discovery, supplier Product/Offer entry and Product Operations review/publication only. Their full-platform Definitions of Done do not pull Orders, Finance, WMS or other workspaces into P01.

## 2. Surface and component decisions

| Surface/component | Decision | Source evidence and reason |
|---|---|---|
| Next storefront application/router | EXTEND | `apps/storefront/src/app/[locale]` provides routes/layouts. Keep Next; make locale a language rather than a country/region. |
| Country middleware and locale helpers | REPLACE | `src/middleware.ts`, `lib/helpers/hreflang.ts`: country/region map drives prefix and product pricing region. /fa, /en, /ar, /fr must work independently of commercial regions. |
| Root layout/providers | EXTEND | `app/layout.tsx` fetches a commerce cart and uses Funnel Display. Remove P01 catalog's dependency on cart bootstrap; set language/direction/fonts and preserve reusable providers. |
| HTML language setter | REPLACE | `components/atoms/HtmlLangSetter/HtmlLangSetter.tsx` updates lang on the client only. It does not establish server-rendered lang/dir/font behavior. |
| Header/navigation/links | EXTEND | `organisms/Header`, `cells/Navbar`, `molecules/LocalizedLink`. Keep structure; remove supplier shopping, cart/checkout links from the P01 experience and add language-aware category navigation. |
| Category navigation | EXTEND | `app/[locale]/(main)/categories`, `lib/data/categories.ts`, CategoryCard. Use real native category tree and retailer-safe DTOs; enforce parent/child relationship. |
| Product listing/cards | EXTEND | ProductListing, ProductsList, ProductCard provide layouts and image/link primitives. Card derives cheapest commerce price; listing calculates count from returned page length. Replace those data assumptions. |
| Product API data helpers | REPLACE | `lib/data/products.ts` requests inventory quantity, catches API failures into empty results and sorts a fetched subset. Replace with explicit B2B API contract, real total/count and DB pagination/sorting. |
| Product detail business composition | REPLACE | ProductDetailsPage fetches Offers; ProductDetails ranks offers and selects a buybox seller. Reuse gallery/descriptive primitives but remove buybox, seller comparison, stock and checkout behavior. |
| Product gallery/images | REUSE | `organisms/ProductGallery` and Next image primitives. Verify keyboard, focus, alternative text and responsive behavior; no product image generation required. |
| Filters/search | EXTEND | ProductSidebar, useFilters and URL helpers supply interaction primitives. Replace commerce price/size/condition assumptions with category, public indicative ranges and approved attribute contracts. |
| Pagination | EXTEND | ProductsPagination can be reused with API total/offset/limit. No pagination over an arbitrary fetched subset. |
| Cart/request basket | NOT APPLICABLE | Native cart/checkout is commerce execution. P01 does not create a request basket, cart or Order. Any future request action remains explicitly unavailable. |
| Checkout/payment/order pages | NOT APPLICABLE | No P01 integration; no fake submission, reference or success state. |
| Account/My Didar domain screens | NOT APPLICABLE | Retain only authentication/session/user-context primitives needed for catalog access. My Orders, invoices, balance and tracking are later packages. |
| Storefront authentication | EXTEND | Existing customer login/cookies may be reused; backend must additionally derive retailer membership and catalog permission. A valid customer token alone is insufficient. |
| Admin host and route extensions | EXTEND | `apps/admin-test` mounts the dashboard; package routes merge host `src/routes` overrides. Use host pages and SDK extension zones, not wholesale edits to `packages/admin`. |
| Product Ops navigation | EXTEND | MainLayout supports permission filtering and host navigation overrides; `packages/dashboard-sdk/src/navigation.ts` discovers `src/_navigation.ts`. Build a Product Ops menu, not the eventual whole console. |
| Admin Product list/detail | EXTEND | `packages/admin/src/pages/products/product-list`, `product-detail` and API hooks. Reuse tables, modal forms, resource header and gallery; add submission/offer context and structured history. |
| Native product approval controls | EXTEND | ProductActiveRequestSection calls real confirm/reject/requestChanges endpoints. Native confirm publishes immediately; Didar needs permission/state-aware approval and publication composition. |
| Native Product Edit/change views | EXTEND | ProductActiveEditSection and product-edit workflows support staged changes and diffs. Add gold-field/Offer revisions and actual user/organization context. |
| Admin Offer screens | EXTEND | `packages/admin/src/pages/offers`: pricing/inventory-centered views. Reuse tables and links but present Didar weights/fees/availability, not invented cash prices or stock. |
| Vendor Product/Offer screens | EXTEND | `packages/vendor/src/pages/products`, `pages/offers`: reuse forms/media and own-seller identity. Native Offer create form requires prices/inventory; replace its business form with a Didar adapter. |
| Tables/forms/state/query | REUSE | Medusa UI primitives, React Hook Form/Zod, TanStack Query/Table, SDK clients and React Router loaders. Add feature schemas, permissions and conflict/error handling. |
| Shared i18n/direction | EXTEND | Dashboard translations already include fa/ar/en/fr; useDocumentDirection observes dir. This does not prove full mirroring, translated Didar messages or correct font switching. |
| Tokens/RTL/responsiveness | EXTEND | Tailwind and Medusa UI/shared components supply primitives. Audit physical left/right styles, drawer alignment, mixed-direction codes and table usability across 16 states. |
| General dashboards/notifications/exceptions | NOT APPLICABLE | No decorative KPI, notification center or generic exception platform in P01. Required review validation/conflicts remain visible on the relevant Product screens. |

Paths in this table are relative to the repository; storefront component paths are beneath `apps/storefront/src`.

## 3. Backend behavior that changes UI mapping

1. Native Offer references both Product and Variant, with seller/SKU uniqueness and product/variant/seller indexes. Keep these identities.
2. `workflows/offer/workflows/create-offers.ts` requires inventory items; vendor validators also require positive prices. The reusable native Offer model/service/creation step is separable from this ecommerce workflow.
3. `confirm-products.ts` requires PROPOSED and changes native status to PUBLISHED. Approval/publication cannot be inferred from the button label alone.
4. `request-product-change.ts` records a CHANGE_REQUESTED action but leaves native Product status PROPOSED. Persist a Didar review state explicitly.
5. `auto-confirm-product-change.ts` auto-confirms when PRODUCT_REQUEST is disabled. Configure that flag for Didar and guard every alternative mutation path.
6. Vendor Product ownership helpers use PRODUCT_ADD audit with `created_by = sellerId`. Preserve native ownership compatibility and separately persist actual acting user/organization.
7. Native store Offer defaults expose supplier identity, stocked quantity and internal metadata. A safe new screen does not make those existing APIs safe.
8. Native permission middleware grants all when no resolver is configured. P01 requires real, fail-closed Product permissions and organization membership.

Evidence: `packages/core/src/modules/offer/models/offer.ts`, `api/vendor/offers/validators.ts`, `api/store/offers/query-config.ts`, `api/vendor/products/helpers.ts`, `api/utils/permissions-middleware.ts`, `workflows/product` and `workflows/product-edit`.

## 4. UI compatibility findings

Existing documentation `docs/UI-ARCHITECTURE.md` describes host route overrides, compound page components, widget zones and dashboard primitives. Source confirms these extension points. They are the preferred application boundary.

The storefront has useful catalog structure but its default business composition is unsuitable for retailer requests. In particular, offers/buybox, region-dependent pricing, swallowed fetch errors and client/subset price sorting must not carry into Didar discovery.

Native Custom Fields synchronize schema during loader startup (`modules/custom-fields/loaders.ts`). For migration-controlled, indexed, report-critical Didar catalog fields, prefer an explicit linked module rather than silent boot-time DDL.

## 5. P01 verification required after implementation

Both retailer and supplier-to-Product-Ops journeys need real API tests, browser tests, backend failure states, direct refresh, backend restart/persistence, permission and bypass tests. The UI matrix is fa/ar/en/fr × 375/768/1280/1920 pixel viewports. Fonts are Vazirmatn, IBM Plex Sans Arabic and Inter as specified. Verify lang, dir, font, navigation, filters, drawers/dialogs, tables, dates/numbers and LTR Product codes inside RTL pages.

No screenshot, source audit or owner-confirmed native runtime marks P01 PASSED. P01 code remains NOT STARTED pending implementation-map review.

