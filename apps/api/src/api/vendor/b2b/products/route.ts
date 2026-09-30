import { endpoint } from "../../../b2b/endpoint";
import * as read from "../../../../modules/didar-catalog/read";
import * as write from "../../../../modules/didar-catalog/write";
export const GET = endpoint(async (r, a) =>
  read.internalProducts(r.scope, a, r.query),
);
export const POST = endpoint(async (r, a) =>
  write.createProduct(r.scope, a, r.body),
);
