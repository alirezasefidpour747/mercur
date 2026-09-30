import { endpoint } from "../../../../b2b/endpoint";
import { supplierCatalog } from "../../../../../modules/didar-catalog/read";
export const GET = endpoint(async (r, a) =>
  supplierCatalog(r.scope, a, r.query),
);
