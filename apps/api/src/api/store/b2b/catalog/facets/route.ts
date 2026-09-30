import { endpoint } from "../../../../b2b/endpoint";
import * as read from "../../../../../modules/didar-catalog/read";
export const GET = endpoint(async (r, a) => read.facets(r.scope, a, r.query));
