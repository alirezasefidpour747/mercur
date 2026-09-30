import { describe, test, expect } from "bun:test";
import {
  CatalogError,
  validateTerms,
  validateProduct,
  validatePublicTerms,
  nextState,
  queryParams,
  permit,
  hash,
  decimalUnits,
} from "../domain";
const base = {
  weight_type: "RANGE",
  weight_min: "6",
  weight_max: "9",
  making_fee_type: "PERCENT",
  making_fee_value: "14",
  availability_type: "MADE_TO_ORDER",
};
const invalid = (fn: () => unknown, status: number, code?: string) => {
  try {
    fn();
    throw Error("Expected rejection");
  } catch (e) {
    expect(e).toBeInstanceOf(CatalogError);
    expect((e as CatalogError).status).toBe(status);
    if (code) expect((e as CatalogError).code).toBe(code);
  }
};
describe("P01 business boundaries", () => {
  test("PERCENT and RANGE_PERCENT support decimal-string precision", () => {
    expect(validateTerms(base).making_fee_value).toBe("14");
    expect(
      validateTerms({
        ...base,
        making_fee_type: "RANGE_PERCENT",
        making_fee_value: null,
        making_fee_min: "12.000001",
        making_fee_max: "16",
      }).making_fee_min,
    ).toBe("12.000001");
  });
  test("FIXED always rejects without inventing a basis", () =>
    invalid(
      () => validateTerms({ ...base, making_fee_type: "FIXED" }),
      422,
      "FIXED_NOT_SUPPORTED",
    ));
  test("mixed weight/fee fields, reversed bounds, numeric JSON and missing exact weights reject", () => {
    for (const b of [
      { ...base, weight_min: "10" },
      { ...base, exact_weight: "6" },
      { ...base, weight_min: 6 },
      { ...base, weight_type: "EXACT", weight_min: null, weight_max: null },
      { ...base, making_fee_value: null },
      { ...base, making_fee_min: "2" },
    ])
      invalid(() => validateTerms(b), 422);
  });
  test("no forged Supplier, stock, currency, UID or approval fields", () => {
    for (const key of [
      "supplier_id",
      "seller_id",
      "organization_id",
      "uid",
      "stock_location_id",
      "price",
      "currency",
      "status",
    ])
      invalid(
        () => validateTerms({ ...base, [key]: "forged" }),
        422,
        "UNSUPPORTED_FIELD",
      );
  });
  test("public ranges are independently nullable and percent-only", () => {
    expect(validatePublicTerms({})).toEqual({
      public_weight_min: null,
      public_weight_max: null,
      public_fee_min: null,
      public_fee_max: null,
    });
    invalid(
      () =>
        validatePublicTerms({ public_weight_min: "8", public_weight_max: "6" }),
      422,
    );
    invalid(() => validatePublicTerms({ making_fee_type: "FIXED" }), 422);
  });
  test("APPROVED differs from PUBLISHED and invalid transitions fail", () => {
    expect(nextState("SUBMITTED", "approve")).toBe("APPROVED");
    expect(nextState("APPROVED", "publish")).toBe("PUBLISHED");
    invalid(() => nextState("SUBMITTED", "publish"), 409);
    invalid(() => nextState("PUBLISHED", "approve"), 409);
  });
  test("catalog query rejects hidden dimensions and expansions", () => {
    for (const key of [
      "supplier_id",
      "supplier_offer_id",
      "stock",
      "uid",
      "fields",
      "expand",
      "metadata",
    ])
      invalid(() => queryParams({ [key]: "anything" }), 422);
  });
  test("URL attributes normalize to an allowlisted query contract", () => {
    expect(
      queryParams({ "attributes[p01-finish]": "pattrval_one" }).attributes,
    ).toEqual({ "p01-finish": "pattrval_one" });
    invalid(
      () => queryParams({ "attributes[unsafe]": { nested: "unsafe" } }),
      422,
    );
  });
  test("count pagination range and sort validate server inputs", () => {
    expect(
      queryParams({ offset: "24", limit: "24", sort: "weight" }).offset,
    ).toBe(24);
    for (const q of [
      { limit: "101" },
      { offset: "-1" },
      { sort: "supplier" },
      { weight_min: "9", weight_max: "6" },
    ])
      invalid(() => queryParams(q), 422);
  });
  test("permission fallback is absent and audience matters", () => {
    const a: any = { kind: "SUPPLIER", permissions: [] };
    invalid(() => permit(a, "product.approve", "DIDAR"), 403);
    a.permissions = ["product.approve"];
    invalid(() => permit(a, "product.approve", "DIDAR"), 403);
  });
  test("stable hash distinguishes changed idempotent payloads", () => {
    expect(hash({ a: 1, b: 2 })).toBe(hash({ b: 2, a: 1 }));
    expect(hash({ a: 2 })).not.toBe(hash({ a: 1 }));
    expect(decimalUnits("99999999999999.000001")).toBe(99999999999999000001n);
  });
  test("native Product common fields cannot carry Supplier terms", () => {
    const p = {
      title: "Gold",
      handle: "gold",
      product_code: "D-1",
      subcategory_id: "pcat_leaf",
      karat: 18,
      material: "gold",
      images: [],
    };
    expect(validateProduct(p).attribute_value_ids).toEqual([]);
    invalid(() => validateProduct({ ...p, supplier_offers: [] }), 422);
    invalid(
      () => validateProduct({ ...p, images: ["javascript:alert(1)"] }),
      422,
    );
  });
});
