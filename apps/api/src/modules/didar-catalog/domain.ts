import { createHash, randomUUID } from "node:crypto";

export class CatalogError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export const fail = (status: number, code: string, message: string): never => {
  throw new CatalogError(status, code, message);
};
export const id = (prefix: string) =>
  `${prefix}_${randomUUID().replaceAll("-", "")}`;
export const states = [
  "DRAFT",
  "SUBMITTED",
  "CHANGES_REQUESTED",
  "APPROVED",
  "REJECTED",
  "PUBLISHED",
  "INACTIVE",
] as const;
export type Actor = {
  id: string;
  type: string;
  organization_id: string;
  kind: "DIDAR" | "SUPPLIER" | "RETAILER";
  seller_id: string | null;
  permissions: string[];
  roles: string[];
};
export const rolePermissions: Record<string, string[]> = {
  PRODUCT_OPS: [
    "product.read",
    "product.review",
    "product.approve",
    "product.reject",
    "product.request_changes",
    "product.publish",
    "product.unpublish",
    "product.update_controlled",
    "supplier_offer.read",
    "supplier_offer.review",
    "product.report",
    "product.audit",
  ],
  SUPPLIER_PRODUCT_OPERATOR: [
    "product.read_own",
    "product.create_own",
    "product.update_own",
    "product.submit_own",
    "supplier_offer.read_own",
    "supplier_offer.create_own",
    "supplier_offer.update_own",
    "supplier_offer.submit_own",
  ],
  RETAILER_PROCUREMENT: ["catalog.read_retailer"],
};
export function permit(actor: Actor, permission: string, kind?: Actor["kind"]) {
  if ((kind && actor.kind !== kind) || !actor.permissions.includes(permission))
    fail(403, "FORBIDDEN", "Product permission is required");
}
export function strict(value: unknown, keys: string[]): Record<string, any> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    fail(422, "INVALID_PAYLOAD", "An object is required");
  for (const k of Object.keys(value as object))
    if (!keys.includes(k))
      fail(422, "UNSUPPORTED_FIELD", `Unsupported field: ${k}`);
  return value as Record<string, any>;
}
export function text(
  value: unknown,
  field: string,
  max = 500,
  optional = false,
): string | null {
  if (optional && (value === undefined || value === null || value === ""))
    return null;
  if (typeof value !== "string" || !value.trim() || value.length > max)
    fail(422, "INVALID_FIELD", `Invalid ${field}`);
  return (value as string).trim();
}
export function integer(
  value: unknown,
  field: string,
  min = 0,
  max = 1_000_000,
): number {
  const n = Number(value);
  if (
    value === "" ||
    value === null ||
    value === undefined ||
    !Number.isSafeInteger(n) ||
    n < min ||
    n > max
  )
    fail(422, "INVALID_FIELD", `Invalid ${field}`);
  return n;
}
export function decimal(
  value: unknown,
  field: string,
  positive = false,
): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || !/^\d{1,14}(\.\d{1,6})?$/.test(value))
    fail(
      422,
      "INVALID_DECIMAL",
      `${field} must be a nonnegative decimal string with at most six decimal places`,
    );
  if (positive && decimalUnits(value as string) <= 0n)
    fail(422, "INVALID_DECIMAL", `${field} must be positive`);
  return value as string;
}
export const decimalUnits = (value: string) => {
  const [a, b = ""] = value.split(".");
  return BigInt(a) * 1_000_000n + BigInt(b.padEnd(6, "0"));
};
export function range(min: string | null, max: string | null, field: string) {
  if (
    (min === null) !== (max === null) ||
    (min !== null && max !== null && decimalUnits(min) > decimalUnits(max))
  )
    fail(422, "INVALID_RANGE", `Invalid ${field} range`);
}
export function validateTerms(body: unknown) {
  const b = strict(body, [
    "supplier_product_code",
    "weight_type",
    "exact_weight",
    "weight_min",
    "weight_max",
    "making_fee_type",
    "making_fee_value",
    "making_fee_min",
    "making_fee_max",
    "availability_type",
    "lead_time_days",
  ]);
  if (b.making_fee_type === "FIXED")
    fail(
      422,
      "FIXED_NOT_SUPPORTED",
      "FIXED making fees are not active in P01; use PERCENT or RANGE_PERCENT",
    );
  if (!["PERCENT", "RANGE_PERCENT"].includes(b.making_fee_type))
    fail(422, "INVALID_FEE_MODE", "Use PERCENT or RANGE_PERCENT");
  if (!["EXACT", "RANGE"].includes(b.weight_type))
    fail(422, "INVALID_WEIGHT_MODE", "Use EXACT or RANGE");
  const exact_weight = decimal(b.exact_weight, "exact_weight", true),
    weight_min = decimal(b.weight_min, "weight_min", true),
    weight_max = decimal(b.weight_max, "weight_max", true);
  if (
    b.weight_type === "EXACT"
      ? !exact_weight || weight_min !== null || weight_max !== null
      : exact_weight !== null || !weight_min || !weight_max
  )
    fail(422, "INVALID_WEIGHT", "Weight fields do not match mode");
  range(weight_min, weight_max, "weight");
  const making_fee_value = decimal(b.making_fee_value, "making_fee_value"),
    making_fee_min = decimal(b.making_fee_min, "making_fee_min"),
    making_fee_max = decimal(b.making_fee_max, "making_fee_max");
  if (
    b.making_fee_type === "PERCENT"
      ? making_fee_value === null ||
        making_fee_min !== null ||
        making_fee_max !== null
      : making_fee_value !== null ||
        making_fee_min === null ||
        making_fee_max === null
  )
    fail(422, "INVALID_FEE", "Fee fields do not match mode");
  range(making_fee_min, making_fee_max, "making fee");
  if (
    !["AVAILABLE", "MADE_TO_ORDER", "UNAVAILABLE"].includes(b.availability_type)
  )
    fail(422, "INVALID_AVAILABILITY", "Invalid internal availability");
  return {
    supplier_product_code: text(
      b.supplier_product_code,
      "supplier_product_code",
      100,
      true,
    ),
    weight_type: b.weight_type,
    exact_weight,
    weight_min,
    weight_max,
    making_fee_type: b.making_fee_type,
    making_fee_value,
    making_fee_min,
    making_fee_max,
    availability_type: b.availability_type,
    lead_time_days:
      b.lead_time_days == null || b.lead_time_days === ""
        ? null
        : integer(b.lead_time_days, "lead_time_days"),
  };
}
export const productKeys = [
  "title",
  "handle",
  "description",
  "technical_description",
  "product_code",
  "subcategory_id",
  "karat",
  "material",
  "type_id",
  "images",
  "attribute_value_ids",
];
export const publicTermKeys = [
  "public_weight_min",
  "public_weight_max",
  "public_fee_min",
  "public_fee_max",
];
export function validateProduct(body: unknown) {
  const b = strict(body, productKeys);
  const attribute_value_ids = b.attribute_value_ids ?? [];
  if (
    !Array.isArray(attribute_value_ids) ||
    attribute_value_ids.length > 30 ||
    attribute_value_ids.some(
      (v) => typeof v !== "string" || !/^pattrval_[\w-]+$/.test(v),
    )
  )
    fail(422, "INVALID_ATTRIBUTES", "Choose approved native attribute values");
  const images = b.images ?? [];
  if (!Array.isArray(images) || images.length > 20)
    fail(422, "INVALID_IMAGES", "At most twenty images are allowed");
  const urls = images.map((u: unknown) => {
    const url = text(u, "image", 2000)!;
    try {
      if (!["http:", "https:"].includes(new URL(url).protocol)) throw Error();
    } catch {
      fail(422, "INVALID_IMAGE", "Use an HTTP or HTTPS image URL");
    }
    return url;
  });
  const handle = text(b.handle, "handle", 150)!;
  if (!/^[\p{L}\p{N}-]+$/u.test(handle))
    fail(
      422,
      "INVALID_HANDLE",
      "Handle may contain letters, numbers and hyphens",
    );
  return {
    title: text(b.title, "title", 250)!,
    handle,
    description: text(b.description, "description", 10000, true),
    technical_description: text(
      b.technical_description,
      "technical_description",
      10000,
      true,
    ),
    product_code: text(b.product_code, "product_code", 100)!,
    subcategory_id: text(b.subcategory_id, "subcategory_id", 100)!,
    karat: integer(b.karat, "karat", 1, 24),
    material: text(b.material, "material", 100)!,
    type_id: text(b.type_id, "type_id", 100, true),
    images: urls,
    attribute_value_ids: [...new Set<string>(attribute_value_ids)],
  };
}
export function validatePublicTerms(body: unknown) {
  const b = strict(body, publicTermKeys),
    out: Record<string, string | null> = {};
  for (const key of publicTermKeys)
    out[key] = decimal(b[key], key, key.startsWith("public_weight"));
  range(out.public_weight_min, out.public_weight_max, "public weight");
  range(out.public_fee_min, out.public_fee_max, "public fee");
  return out;
}
const ordered = (v: any): any =>
  Array.isArray(v)
    ? v.map(ordered)
    : v && typeof v === "object"
      ? Object.fromEntries(
          Object.keys(v)
            .sort()
            .map((k) => [k, ordered(v[k])]),
        )
      : v;
export const hash = (v: unknown) =>
  createHash("sha256")
    .update(JSON.stringify(ordered(v)))
    .digest("hex");
export const nativeFields = [
  "title",
  "handle",
  "description",
  "material",
  "type_id",
  "images",
] as const;
export function fingerprint(p: any) {
  return hash({
    title: p.title,
    handle: p.handle,
    description: p.description ?? null,
    material: p.material ?? null,
    type_id: p.type_id ?? null,
    images: (p.images ?? [])
      .map((i: any) => (typeof i === "string" ? i : i.url))
      .sort(),
  });
}
export function nextState(state: string, action: string): string {
  const transitions: Record<string, Record<string, string>> = {
    submit: { DRAFT: "SUBMITTED", CHANGES_REQUESTED: "SUBMITTED" },
    request_changes: { SUBMITTED: "CHANGES_REQUESTED" },
    reject: { SUBMITTED: "REJECTED" },
    approve: { SUBMITTED: "APPROVED" },
    publish: { APPROVED: "PUBLISHED" },
  };
  const next = transitions[action]?.[state];
  if (!next) fail(409, "INVALID_STATE", `Cannot ${action} from ${state}`);
  return next;
}
export function command(
  body: unknown,
  extra: string[] = [],
): Record<string, any> & {
  expected_version: number;
  idempotency_key: string;
  reason: string | null;
} {
  const b = strict(body, [
    "expected_version",
    "idempotency_key",
    "reason",
    ...extra,
  ]);
  return {
    ...b,
    expected_version: integer(b.expected_version, "expected_version", 1),
    idempotency_key: text(b.idempotency_key, "idempotency_key", 100)!,
    reason: text(b.reason, "reason", 2000, true),
  };
}
export function queryParams(raw: unknown, internal = false) {
  const keys = [
    "category_id",
    "subcategory_id",
    "weight_min",
    "weight_max",
    "fee_min",
    "fee_max",
    "karat",
    "material",
    "type_id",
    "q",
    "sort",
    "limit",
    "offset",
    "handle",
    "attributes",
  ];
  if (internal)
    keys.push(
      "state",
      "supplier_id",
      "actor_id",
      "submitted_from",
      "submitted_to",
      "product_id",
      "status",
      "created_from",
      "created_to",
      "format",
    );
  const normalized: any = { ...(raw as any) };
  for (const key of Object.keys(normalized)) {
    const match = /^attributes\[([\w-]+)\]$/.exec(key);
    if (match) {
      normalized.attributes ??= {};
      if (
        typeof normalized.attributes !== "object" ||
        Array.isArray(normalized.attributes)
      )
        fail(422, "INVALID_ATTRIBUTES", "Invalid attributes");
      normalized.attributes[match[1]] = normalized[key];
      delete normalized[key];
    }
  }
  const b = strict(normalized, keys),
    out: any = {
      ...b,
      limit: integer(b.limit ?? 24, "limit", 1, 100),
      offset: integer(b.offset ?? 0, "offset", 0, 100000),
    };
  for (const k of keys.filter(
    (k) => !["attributes", "limit", "offset"].includes(k),
  ))
    if (b[k] !== undefined && typeof b[k] !== "string")
      fail(422, "INVALID_QUERY", `Invalid ${k}`);
  for (const k of ["weight_min", "weight_max", "fee_min", "fee_max"])
    if (b[k] !== undefined) out[k] = decimal(b[k], k);
  for (const [a, z] of [
    ["weight_min", "weight_max"],
    ["fee_min", "fee_max"],
  ])
    if (out[a] && out[z] && decimalUnits(out[a]) > decimalUnits(out[z]))
      fail(422, "INVALID_RANGE", "Invalid query interval");
  if (b.karat !== undefined) out.karat = integer(b.karat, "karat", 1, 24);
  out.sort = b.sort ?? "newest";
  if (!["newest", "name", "weight", "making_fee"].includes(out.sort))
    fail(422, "INVALID_SORT", "Unsupported sort");
  for (const k of [
    "submitted_from",
    "submitted_to",
    "created_from",
    "created_to",
  ])
    if (out[k] && !/^\d{4}-\d{2}-\d{2}(T.*Z)?$/.test(out[k]))
      fail(422, "INVALID_DATE", `Invalid ${k}`);
  if (b.attributes) {
    if (typeof b.attributes !== "object" || Array.isArray(b.attributes))
      fail(422, "INVALID_ATTRIBUTES", "Invalid attributes");
    for (const [k, v] of Object.entries(b.attributes))
      if (
        !/^[\w-]+$/.test(k) ||
        typeof v !== "string" ||
        !(v as string).split(",").every((x) => /^[\w-]+$/.test(x))
      )
        fail(422, "INVALID_ATTRIBUTES", "Invalid attribute values");
  }
  return out;
}
