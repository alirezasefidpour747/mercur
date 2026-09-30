import { endpoint } from "../../../../../b2b/endpoint";
import * as write from "../../../../../../modules/didar-catalog/write";
export const POST = endpoint(async (r, a) =>
  write.submit(r.scope, a, r.params.id, r.body),
);
