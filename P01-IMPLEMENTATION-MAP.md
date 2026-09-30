# P01-IMPLEMENTATION-MAP.md

**Status: IN PROGRESS** — preparation completed; awaiting owner review of this map.
**P01 code: NOT STARTED.** No application, migration, seed, component or configuration changes are authorized by this preparation step.
**Baseline:** owner-confirmed successful clean local runtime; source inspected at Mercur `296b5968eac620d3cb689ae130a6a2aa382c9941` (2.3.6-canary.6 / Medusa 2.21.0).
**Authority:** PRODUCT-CORE current file version 2 (document v0.3), REPORTING-FOUNDATION current file version 3 (v0.4), supplied UI documents v0.1, and Product-related boundaries in B2B-RBAC v0.4.

## 1. Scope and verified identity mapping

`Category → Subcategory → Medusa Product → Native Variant → Mercur Supplier Offers`

- Category and Subcategory are two levels of native ProductCategory, using parent_category_id. A Product belongs to one selected active leaf Subcategory in P01; validate its active parent.
- Medusa Product is the authoritative common identity: title/name, handle/slug, description, material, images and type. Didar Product ID is that same native Product ID.
- Create one native Variant per initial Product. Mercur creation supports the default option/variant path; Offers require variant_id. Variant SKU carries the common product code where compatible with native uniqueness.
- Supplier is a native Mercur Seller, referenced through a SUPPLIER organization context. Supplier Offer is a native Mercur Offer tied to that Seller, Product and Variant.
- Linked extension records carry missing Didar fields/revisions; they do not create another Product/SKU hierarchy, variant engine or supplier-offer identity.
- Native Product weight must not become supplier-label physical weight or a proxy for internal supplier ranges. Store supplier weight/fee on Offer extensions; public indicative presentation is separately curated.

P01 includes both real journeys:

1. Retailer API → category/subcategory → Product list/search/filters → Product detail.
2. Supplier Product/Offer draft → submit → Product Ops queue/detail → approve/reject/request changes → authorized publish → retailer discovery.

Excluded: request basket persistence/submission, Order, Proforma, Settlement, Invoice, physical UID, Packaging, Dispatch, full WMS and B2C. No fake Order API or success reference. Full configurable RBAC administration is also excluded; minimum enforceable Product roles/membership are mandatory.

## 2. Business-to-full-stack mapping

T IDs refer to section 9. All endpoints below are **planned**, not implemented.

| Didar Business Requirement | Native Mercur Capability | Reuse / Extend / New | Database | Backend | API | Retailer Storefront | Product Operations UI | Tests |
|---|---|---|---|---|---|---|---|---|
| Category → Subcategory | ProductCategory parent tree, rank, active/internal flags; category media | REUSE + EXTEND validation | Native category IDs/links; indexed leaf reference in catalog profile | Enforce two levels, active ancestry and one selected leaf | B2B category tree/list contract | Category navigation and breadcrumb | Reused category controls within Product editing; no category governance platform | T01,T03 |
| Common Product/SKU identity | Product and native Variant/default-option workflow | REUSE + linked EXTEND | Native Product/Variant; unique profile.product_id/product_code | Native create/update primitives plus Didar validation | Supplier draft, Ops detail, safe retailer detail | Name/code/images/descriptions/karat/material | Native form/media/diff primitives with gold fields | T01,T02,T05 |
| N Supplier Offers | Native Offer model/service and seller/product/variant links | REUSE + EXTEND | Native Offer + one Offer profile and versioned term revisions | Didar creation adapter; no ecommerce price/stock prerequisite | Scoped Supplier and internal Offer APIs | No offers/supplier IDs/counts returned | Supplier weights/fee/availability comparison and own-entry forms | T02,T04,T05 |
| Publication review | Native Product review and ProductChange actions/workflows | EXTEND | Submission/version/state + references to native changes | Approve separately from publish; real state checks and revision matching | Submit/approve/reject/request-changes/publish | Only current published profile/native Product; no drafts | Review queue, detail, reason dialog, outcome/history | T05,T06,T07 |
| Safe catalog projection | Native catalog query graph and images/attributes | EXTEND; replace B2C fetch composition | Curated public fields separate from Offer data | Explicit allowlisted DTO; deny legacy discovery bypass | /store/b2b/catalog/* | Real list/detail, no buybox or stock promise | Full supplier detail only when permitted | T04,T08 |
| Real filters/search/sort | Native category/type/attribute data and query validators | EXTEND | Profile indexes and structured approved attribute relationships | DB predicates/count/order before pagination | Strict query parameters/facets | URL-addressable filters and actual total | Scope-aware queue/internal Offer filters | T03,T08 |
| Supplier organization scope | Member/SellerMember and native seller-context checks | REUSE + minimum EXTEND | Organization/membership/role links; Seller association | Derive supplier from authenticated membership; reject forged ownership | Vendor adapters; guard native alternate mutations | No supplier selector | Own supplier workspace; authorized Didar cross-supplier review | T04,T07 |
| Product Ops / retailer permissions | User/customer/member auth and resolver extension point | EXTEND | Product role grants and active membership | Fail-closed permissions; no grant-all fallback for Didar | Context + authenticated scoped endpoints | Allowed catalog only; 401/403 states | Role menu plus backend action permission | T04,T07,T10 |
| Actor/audit/status history | Native ProductChange/Action, timestamps | REUSE + structured EXTEND | Append-oriented event records, user/org/owner/state/version refs | Write actor and history with each completed command | Scoped timeline/query/export endpoints | No internal audit/notes | Review timeline, authorized report drill-down/export | T06,T07,T08 |
| Reporting readiness | Native stable IDs/links and query services | EXTEND | Product/Offer grain, structured measures and indexes | Count distinct products; explicit filters and history | Authorized Product/Offer reports | Public catalog facets only | Product reports using real persisted data | T08 |
| Four languages/directions | Next routing; dashboard i18next/fa/ar/en/fr; direction hooks | EXTEND; replace country-as-language logic | Stable codes; language only in presentation | No permission/scope change on language switch | Same audience DTOs in all languages | /fa,/en,/ar,/fr + fonts/RTL | Localized Ops and Supplier hosts | T10 |
| Real errors/refresh/responsiveness | Layouts, query tools, forms, tables, image primitives | REUSE + EXTEND | Persisted records independent of browser | Typed errors; no caught error→empty success | 401/403/409/422 + actual transport failures | Loading/empty/error and direct refresh | Validation/conflict/retry and usable mobile actions | T09,T10 |

## 3. Native reuse evidence and required adaptations

### Product and review

Relevant source:
- `packages/core/src/workflows/product/workflows/create-products.ts`: native Product/Variant creation, default option path, audit.
- `workflows/product/workflows/confirm-products.ts`: PROPOSED → PUBLISHED.
- `workflows/product/workflows/reject-product.ts`: PROPOSED → REJECTED.
- `workflows/product/workflows/request-product-change.ts`: records CHANGE_REQUESTED without changing native Product status.
- `workflows/product-edit/workflows/stage-product-change.ts`, `auto-confirm-product-change.ts`: staged edits; auto-confirm unless PRODUCT_REQUEST is enabled.
- `api/vendor/products/helpers.ts`: native creator ownership uses sellerId in PRODUCT_ADD history.

Use an application workflow adapter with the native workflows/steps. Enable PRODUCT_REQUEST and forbid automatic Supplier publication or status edits through alternate routes. Preserve the native seller-ownership convention where required, but record actual actor_user_id and actor_organization_id separately; never report sellerId as if it were a person.

### Offer

Relevant source:
- `modules/offer/models/offer.ts`: stable seller/product/variant identity, native SKU uniqueness/indexes.
- `workflows/offer/workflows/create-offers.ts` and `api/vendor/offers/validators.ts`: ecommerce workflow requires inventory and prices.
- `workflows/offer/steps/create-offers.ts`: native service creation with compensating deletion.

Use the native Offer service/creation step through a Didar workflow that validates Seller, Product and Variant and persists linked commercial terms. Do not invoke the ecommerce create-offers workflow merely to obtain an Offer ID. Do not invent a price, quantity, stock location, UID or cash settlement unit.

Native shipping_profile_id remains a valid configured native default shipping-profile reference, not a delivery promise. Generate an internal unique native Offer SKU when supplier_product_code is absent. Native inventory management is false for these catalog-only Offer rows; this does not declare physical availability. Do not create inventory items/levels or pricing rows in P01. Verify price-less, inventory-less Offer graph reads in T02; use the native service as the fallback to an unavailable exported step, not a new Offer table.

### Application boundary

Place new business code under `apps/api/src/modules`, `links`, `workflows`, `api`, `scripts` and host UI overrides. Keep native core/dashboard package source and upstream patches unchanged. P01's authentication adapters are limited to Product roles; no role-management UI or unrelated permissions.

Do not use native Custom Fields for required migration-controlled fields: the inspected loader generates/applies schema SQL at startup. Use a small linked `didar-catalog` module with explicit checked-in migrations.

## 4. Database and integrity plan

| Record | Fields/relationships to persist | Index/constraint plan |
|---|---|---|
| Native ProductCategory | name/handle/description, parent_category_id, rank, active/internal, native image/media links | Reuse native IDs and constraints; validate leaf/parent on each edit. Native physical index names are confirmed during migration introspection, not guessed. |
| Native Product/Variant | Common Product identity and minimal Variant. material and descriptive/media/type fields remain native | Stable native IDs; exactly one Variant for the initial slice; unique common product code in linked profile. |
| CatalogProfile (1:1 Product) | product_id, product_code, karat, technical_description, subcategory_id, publication state, published revision, version, actor timestamps; separately named nullable public indicative weight/fee fields | Unique product_id/code; indexes on subcategory/state, public weight bounds, public percentage-fee bounds and publication time. Leaf ID must match native category link. |
| Public query fields on CatalogProfile | Derived root_category_id, public_sort_name, public_search_text/type reference from native public fields; no Supplier or stock terms | GIN full-text search and B-tree sort/filter indexes. These are a synchronized query projection of the native catalog, not a new catalog identity. Regenerate after relevant Product/category edits. |
| OfferProfile (1:1 native Offer) | offer_id, active revision, ACTIVE/INACTIVE status, version, actual creator/updater and owner organization | Unique offer_id; status/version index. Native Offer provides supplier/product/variant references. |
| OfferTermRevision | offer_id, revision, supplier_product_code, EXACT/RANGE and exact/min/max grams, PERCENT/FIXED/RANGE_PERCENT fee values/bounds/basis, AVAILABLE/MADE_TO_ORDER/UNAVAILABLE, lead_time_days, actor/time | Unique (offer_id,revision); structured numeric fields and applicable indexes. Reviewed revisions are immutable; edits create a revision. |
| ProductSubmission | native product_id, supplier organization, candidate/native ProductChange reference, Offer revision references, review state, version, submit/review timestamps/actors/reasons | Index (state,submitted_at,id), supplier/state, product/version; unique active submission constraint per applicable product/supplier candidate. |
| Candidate extension values | Typed candidate profile/Offer term values linked to the submission; do not overwrite published gold/presentation fields before authorization | Versioned candidate values and native staged ProductChange references; publish activates a matching approved revision only. |
| CatalogEvent | entity type/id, Product/Offer/Submission/native-change refs, event code, from/to state, actual actor user/org/type, business-owner org, role context, on_behalf_of, timestamp, command ID, before/after and reason | Append-oriented; unique (command_id,event sequence), indexes on entity/time, organization/time, actor/time. Critical relationships/status/measure fields are structured, not only JSON. |
| Minimum identity context | Organization type/reference, active native-actor membership and normalized role grants; SUPPLIER maps to Seller, retailer membership to customer actor, DIDAR to native user | Unique membership/grants; indexes actor/org/status. No configurable RBAC builder or user-management journey. |
| Command receipt | organization, actor/resource, idempotency key, payload hash, command/version/outcome reference | Unique scoped key; replay identical command returns its recorded outcome; conflicting payload returns 409. |

Weights use grams; decimal business values use PostgreSQL numeric, with decimal-string JSON values to avoid binary-float loss. Validate nonnegative fees, valid EXACT/RANGE fields, lower ≤ upper, positive weight where supplied and integral nonnegative lead time. Do not invent a maximum percentage or settlement currency.

Public indicative terms are manually curated/approved by Product Ops, nullable and explicitly labeled indicative. They are not automatically min/max of Supplier Offers, do not expose supplier cost and are never accepted commercial snapshots. Missing public ranges do not remove a published product from the unfiltered catalog.

Keep one source of truth for common Product fields. The profile's search/sort fields are derived and updated by catalog workflows. Queries use these indexed fields, hydrate native Product/category/media through registered links/query services, and fail closed on stale publication or inactive native ancestry. Category mutation recomputes affected projections; never silently serve an outdated approved range/name. No writes into native tables outside native services/steps.

Cross-module workflows use resource locking, version guards, idempotent steps and compensation. Do not claim automatic atomicity across independent Medusa modules. Publication is activated last; failed native/profile/audit steps must not produce a visible partially published catalog item. Fault-injection and recovery are required in T06.

### Review/state mapping

| Action | Didar state/result | Native behavior/reuse | Gate |
|---|---|---|---|
| Save initial draft | DRAFT | Native Product draft + one Variant; candidate Offer/profile terms | Supplier own scope; valid fields |
| Submit | SUBMITTED with immutable candidate version | Native Product proposed for first publication; keep staged changes for published Product edits | Supplier submit permission; candidate complete |
| Request Changes | CHANGES_REQUESTED | Native change-request workflow/audit; native Product may remain proposed | Didar Product Ops; expected submission version |
| Correct and resubmit | New candidate revision → SUBMITTED | Native draft/staged edits; previous candidate/history retained | Own Supplier; editable state only |
| Reject | REJECTED | Native rejection for initial proposed Product; reject staged change for already published Product | Review permission; current version; visible reason |
| Approve | APPROVED, still not publicly visible for first publication | Record approved candidate; do not call native confirm yet | product.approve |
| Publish/activate | PUBLISHED and current approved terms | Native confirm for first proposed Product; confirmed native ProductChange for approved edits; activate extension revisions last | product.publish; matching approved version |
| Unpublish/deactivate | INACTIVE for discovery; identities/history retained | Native unpublish/status primitive + profile publication gate | product.unpublish |

Separate approval and publication is the conservative interpretation of the existing distinct permissions and workflow steps. A later combined “Approve and Publish” action would require both permissions and preserve both events. Approval does not automatically confer publishing authority.

Offer-only submissions do not change an already published Product's native status. Activate the approved Offer revision without rewriting another Supplier's Offer or the common Product. Pending edits preserve the current published version until authorized activation. Supplier changes to published common Product data remain staged.

## 5. API contracts and exposure boundary

Use three separate clients/query namespaces: retailer catalog, supplier authoring and Didar operations. Endpoints below are proposed application routes; native methods are reused behind them.

| API | Audience and request | Required response/UI consumption |
|---|---|---|
| GET /store/b2b/context | Authenticated customer + active retailer membership | Actor/org and effective Product permissions; catalog shell/login context |
| GET /store/b2b/catalog/categories | catalog.read_retailer | Active root/child IDs, names, handles, public images and rank; category navigation |
| GET /store/b2b/catalog/products | Allowlisted filters below, optional exact handle lookup; bounded limit/offset | products[], count, offset, limit; each safe Product DTO; Product List and handle resolver |
| GET /store/b2b/catalog/products/:id | Authorized retailer; published identity only | Safe Product detail DTO; Product Detail |
| GET /store/b2b/catalog/facets | Same public filter scope, excluding hidden dimensions | Actual category/type/approved attribute buckets and available public range bounds |
| GET/POST /vendor/b2b/products; GET/PATCH /vendor/b2b/products/:id | Active Supplier Member, own authoring scope | Own Product draft/candidate and own Offers; supplier list/form/detail |
| POST /vendor/b2b/products/:id/submit | expected_version + command key | Submission ID/state/version, actual persisted result |
| GET/POST /vendor/b2b/offers; GET/PATCH /vendor/b2b/offers/:id | Own Seller derived server-side; typed term revision | Own Offer/revision only; Offer entry/edit form |
| GET /admin/b2b/product-reviews; GET /admin/b2b/product-reviews/:id | product.review + DIDAR context | Product, submitting Supplier, candidate Offer terms, native change references, state, version and scoped history |
| POST /admin/b2b/product-reviews/:id/{approve,reject,request-changes,publish} | Separate action permission, expected_version, reason as applicable, command key | review{ id,state,version }, product_id and publication result; real controls/feedback |
| GET /admin/b2b/products; GET /admin/b2b/products/:id; GET /admin/b2b/offers | Authorized Didar Product read | Common/native data + structured extensions, supplier comparisons and history |
| POST /admin/b2b/products/:id/unpublish | product.unpublish, expected_version, command key | Persisted INACTIVE state and version; discovery invalidation |
| GET /admin/b2b/catalog-events and /admin/b2b/product-reports | Product/audit/report permission | Structured filters/drill-down and authorized CSV extraction; no final dashboard suite |

Supplier routes may reference an existing published Product's permitted common identity when adding its own Offer; they must not reveal another Supplier's draft/Offer/history. Didar entry on behalf of a Supplier, where used, records DIDAR as actual actor organization and SUPPLIER as business owner. Supplier Admin alone is not silently granted Product Operator permissions; multiple roles can be explicitly assigned.

Safe retailer DTO: id (native Product ID), handle, name, product_code, category{id,name,handle}, subcategory{id,name,handle}, description, technical_description, images[], karat, material, approved public type/attributes, nullable indicative_weight{min,max,unit:"g"}, nullable indicative_making_fee{min,max,type:"PERCENT",indicative:true}, and order_mode:"REQUEST_PRODUCT". No native variant blob, metadata passthrough, Offer IDs/counts, supplier, stock, location, lead-time procurement data or UID fields.

Backend uses strict schemas: reject arbitrary fields/expansions, unsupported supplier/UID/stock filters and internal approval inputs. Scoped cache keys and publication invalidation apply; start with no shared authenticated cache until audience isolation is tested.

Guard the existing /store/products, /store/offers, /store/sellers and related expansion/search routes so they cannot bypass the Didar DTO boundary. Guard native admin/vendor Product/Offer mutation, import/batch/status/review routes against bypassing candidate review and actor audit. In this B2B-only app, unused commerce cart/checkout routes must not permit retailer stock reservation; use a feature-unavailable access guard, not an Order implementation. Do not expose them in the P01 shell.

401 = no valid session; 403 = role/scope denied; scoped 404 = missing/not visible; 409 = stale version, conflicting command or invalid transition; 422 = invalid payload/business fields. API failures never become an empty-success response.

## 6. Real filter contracts

AND across dimensions; multiple values within one approved attribute use OR. Reset offset when a filter changes. Validate parent/child compatibility. All matching, count, order and pagination occur in the backend/database before DTO hydration.

| UI filter / URL state | API parameter | Backend query | Structured DB field/index | Required test |
|---|---|---|---|---|
| Category | category_id | Match derived native root reference, active ancestry | CatalogProfile.root_category_id + publication state index | Root and child products; combined filters |
| Subcategory | subcategory_id | Exact validated native leaf reference | CatalogProfile.subcategory_id/state B-tree | Wrong parent rejected; direct refresh |
| Weight range, grams | weight_min, weight_max | Inclusive overlap: public_max ≥ query_min and public_min ≤ query_max; nulls do not match a requested range | public indicative min/max numeric indexes | Exact boundary, overlap, missing terms, invalid interval |
| Making fee, percentage | fee_min, fee_max | Same overlap on approved public percentage terms only | public indicative fee type/min/max numeric indexes | Boundary; no matching against hidden supplier fee |
| Karat/material | karat, material | Approved common Product values; public query projection synchronized | profile.karat/material projection indexes | Combined with category; hidden attributes absent |
| Product type | type_id | Native approved ProductType reference | Public type reference index | Correct type and scope |
| Other approved attributes | attributes[handle]=value_ids | Filter only active/is_filterable/public-approved native attribute/value relations | Native ProductAttributeValue pivot/link indexes; verify physical names during migration | Unsupported/hidden handle rejected; AND/OR behavior |
| Search | q | Normalize/search public name, public code and public category terms only | Derived public_search_text GIN; product_code unique B-tree | Persian/Latin/code/category query; no supplier/UID search leakage |
| Sort | sort=newest/name/weight/making_fee | Published time descending; public canonical name; public lower indicative bound; native Product ID tie-breaker, null terms last | Profile sort fields/indexes | >1 page dataset; deterministic pagination; no subset/client sort |
| Product Ops queue | state, supplier_id, category_id, submitted_from/to, actor_id, q | Authenticated DIDAR scope + candidate/submission predicates | Submission(state,submitted_at,id), supplier/state, event actor/time and profile leaf indexes | Scoped combinations, real totals, stale candidate |
| Internal/own Offers | product_id, supplier_id (Didar only), status, weight/fee bounds, created_from/to | Own supplier enforced independently of requested filters; Didar comparison only by permission | Native Offer product/seller indexes + Offer profile/revision numeric/time indexes | Supplier A cannot query/filter/export Supplier B |

Range-overlap and name/newest sort behavior are technical interpretations recorded here, not changes to supplier commercial rules. Do not show filters for unsupported attributes or unapproved dimensions. A published Product remains browseable/request-compatible even with no physical stock or public indicative range.

## 7. Page-by-page UI mapping

All {lang} prefixes are fa/en/ar/fr. Ops/Supplier routes live in their respective existing app hosts; they do not create more applications.

| Current route/component | Target page | Business/UI contract | API and fields | Filters/actions/permission | Gap and decision |
|---|---|---|---|---|---|
| Storefront /[locale]/categories; CategoryCard/data helper | /{lang}/categories and /categories/{handle} | Product Core hierarchy + Retailer UX | Catalog categories; ID/name/handle/image/parent | Category/Subcategory; catalog.read_retailer | Country prefix and broad category data; EXTEND |
| Storefront ProductListing/ProductsList/ProductCard/ProductSidebar | /{lang}/products (new list route); category routes reuse it | Product Core list + UI Foundation | Catalog products/facets; safe DTO/count | Section 6 filters; detail navigation | Cheapest-price/subset filtering/empty-on-error; EXTEND layout, REPLACE data composition |
| /[locale]/products/[handle]; ProductDetailsPage/Gallery/Details | /{lang}/products/{handle} | Product Core detail + Retailer UX | Filter safe list by handle or resolve handle via safe catalog endpoint, then safe :id detail | Quantity input is local intent only; catalog.read_retailer | Buybox/Offer fetch and stock actions; REPLACE composition, REUSE gallery |
| Admin /products list/table | /{lang}/ops/products and /ops/product-reviews | Product Ops queue | Admin Products/reviews; submitter, product code, state, submitted time, version | Queue filters, row review; product.read/review | Native list lacks complete Didar candidate/context; EXTEND via host route |
| Admin /products/:id; ProductActiveRequest/EditSection | /{lang}/ops/product-reviews/{submissionId} | Product Ops review/detail/history | Review detail and action contracts; candidate images/fields/Offer revisions/history | Approve, Reject, Request Changes, Publish with separate permission/state | Native confirm auto-publishes; request-change state incomplete; EXTEND primitives with adapter controls |
| Admin /offers and Offer detail | /{lang}/ops/supplier-offers and /{id} | Product Core authorized internal Offer | Admin Offer query; seller/product links, weights/fee/availability/revisions | Internal filters; authorized Product/Offer read | Commerce prices/inventory dominate; EXTEND scoped business sections |
| Vendor /products/create and /products/:id | /{lang}/supplier/products/new and /{id} | Own supplier entry/revision | Vendor draft/update/submit; common/candidate fields, media, own Offer refs | Save editable draft, submit, correct/resubmit; Supplier Product Operator | Native form/status and seller-as-actor assumption; EXTEND |
| Vendor /offers/create and /offers/:id | /{lang}/supplier/offers/new and /{id} | Supplier Offer entry | Own Offer adapter; structured supplier terms | Save/edit own permitted revision, submit | Required currency price and inventory; REPLACE business form, REUSE inputs/layout |
| Admin generic MainLayout/nav + host SDK | /{lang}/ops/* Product workspace shell | Product role → queue → detail → action → audit | Native user + Didar context/permissions | Product Review Queue, Products, Supplier Offers, Product Reports only | Generic ecommerce menu; EXTEND via _navigation/host routes |
| Vendor shell and storefront login/session primitives | Localized P01 shells/session states | UI Foundation + Product role boundaries | Actual context/auth APIs | Login/logout/organization context, no fake role switch | Auth alone lacks organization permission; EXTEND |

The detail resolver must be explicit: add an allowlisted handle parameter to the safe catalog list/lookup contract; it must never fall back to the raw native Product list. Legacy route aliases can redirect to localized Product pages after authorization; native unsafe pages must not remain a usable alternate entry.

Every changed page implements LOADING, SUCCESS, EMPTY, ERROR, UNAUTHORIZED and FORBIDDEN as applicable. Submission forms also show 409/422 outcomes, pending state, field errors, double-submit protection and unsaved-change warning. No decorative Product KPI or generic “Product Exceptions” backend is added.

Future “Add to Request” UI is clearly labeled unavailable until Order Core; local quantity input cannot submit, allocate, add a native cart item or show success. Do not expose an enabled nonfunctional button. Detail browsing and allowed Product operations are the real P01 actions.

Language changes update lang/dir/font, preserve resource and permitted filters, and do not change organization context. Retailer layout must stop retrieving the commerce cart at bootstrap. Use logical CSS/directional icon handling, LTR-isolated product codes and explicit grams/percent/date formatting. Translate P01 interface strings in all four languages; do not invent translated supplier descriptions. Canonical supplied product text may display as-is.

## 8. OWNER DECISION REQUIRED and known gaps

### D1 — FIXED making-fee unit and calculation basis

PRODUCT-CORE permits FIXED but specifies neither unit/currency nor whether the value applies per piece, per gram or another basis.

**OWNER DECISION REQUIRED:** define the unit and calculation basis for FIXED Supplier making fees. The implementation must not assume Rial, Toman or grams of gold.

Until resolved: schema supports explicit basis/unit fields, but creating/activating FIXED terms is blocked with a clear validation result. PERCENT and RANGE_PERCENT flows, weights, catalog and review can proceed after map approval. P01 cannot be PASSED with an advertised FIXED path that is a TODO.

### Technical gaps already mapped, not owner design questions

- Separate review state is necessary because native Request Changes leaves Product proposed.
- Native approval/publish workflows need the adapter sequence above; permissions remain distinct.
- Native Offer model can be reused without invoking its price/inventory-creating ecommerce workflow; verify the planned adapter against real DB/API.
- Native global catalog read, generic mutations, permissions fallback and actor conventions need guards/projections.
- Public range filters require curated public terms and indexed query projection; no silent Supplier Offer aggregation.
- Language prefixes must be decoupled from commerce regions.
- Native physical index names and exported workflow/step APIs require implementation-time verification. These are technical checks, not reasons to ask the owner to design the mapping.
- The original execution index omits Order Core; scheduling that future package is outside this P01 map and does not block this preparation.

## 9. Tests and evidence required

No feature tests have run in this preparation. Planned T IDs:

| ID | Required evidence |
|---|---|
| T01 | Fresh native + extension migrations; inspected indexes/constraints; idempotent seed with ≥2 Categories, 3 Subcategories, 5 Products, 3 Suppliers, multiple Offers and one Product with two different Supplier weight/fee conditions. Seed real native identities and explicit actor memberships, not fake inventory. |
| T02 | Native Product/one Variant/Offer persistence; price-less, inventory-less Offer creation and graph/query reads; adapter rollback on failure; no pricing, inventory or UID rows created by P01. |
| T03 | Every section 6 filter/sort chain from UI URL → API → real DB query/index → expected result/count; combined filters, nulls, invalid bounds, search and stable pagination with more than one page. |
| T04 | Supplier A/B and retailer role tests; forged resource/seller/org IDs; raw native store discovery, nested metadata/expansion/search/cache/export bypass; native admin/vendor direct-status/batch/import bypass. |
| T05 | Full supplier draft/submit → Ops queue/detail → request changes/correction → approval → publish → real retailer category/list/detail journey; rejection never publishes; published Product without stock still appears. Published edits preserve previous visible version until activation. |
| T06 | Concurrent approve/reject/publish and stale revisions; edit while review occurs; identical idempotent replay once, conflicting replay 409; failure injection during native/profile/audit update; recover to a coherent hidden/published state. |
| T07 | Actual user/org/on-behalf-of history persisted; reason/role/state events; unauthorized Product action fails with no mutation; immutable reviewed revision; deactivation retains IDs/history. |
| T08 | Scoped Product/Offer report extraction and drill-down; distinct Product counts across multiple Offers; history/date/actor filters; no supplier terms in retailer facets/results. |
| T09 | Backend and frontend builds plus dashboard host builds/typechecks; actual dev servers/API; direct refresh; restart preserves products/revisions/review/audit; backend down shows ERROR rather than empty/success. Next ignoreBuildErrors is not a substitute for typechecking. |
| T10 | Retailer list/detail/category, Supplier draft and Ops queue/detail across 4 languages × 4 viewports (375,768,1280,1920); fonts/lang/dir/mirroring, forms/tables/drawers/pagination, keyboard/focus/contrast, mixed-direction identifiers and permission/error states. |

Package result must name actual files/migrations/endpoints, each screen's real API, test commands/results, role/filter/language evidence, and pending work. No stubs or screenshots alone count as implementation.

## 10. Implementation sequence after review

1. Freeze the approved contracts, source revision and minimum Product authorization context; resolve D1 or keep that branch explicitly blocked.
2. Add linked models/migrations and deterministic seed; reuse native Product/Variant/Seller/Offer identities.
3. Deliver supplier draft → review → publication as the first small real vertical slice, including Supplier and Product Ops screens with real APIs.
4. Connect retailer category/list/detail and server-side filters to the same persisted published catalog.
5. Complete scope/bypass, audit/report queries, error states, localization and the 16-state matrix; run T01–T10.
6. Produce P01-RESULT.md with evidence. Only then may the package become PASSED.

**Review gate:** this document is the completed proposed mapping. Implementation remains NOT STARTED until the owner has reviewed it, as explicitly requested. No code implementation, dependency change or unrelated package work is part of this preparation.
