import { endpoint } from "../../../../b2b/endpoint";
import * as read from "../../../../../modules/didar-catalog/read";
export const GET = endpoint(async (r, a) =>
  read.offers(r.scope, a, r.query, r.params.id),
);
