import { endpoint } from "../../../b2b/endpoint";
import * as read from "../../../../modules/didar-catalog/read";
export const GET = endpoint(async (r, a) =>
  r.query.format === "csv"
    ? { csv: read.csv((await read.reports(r.scope, a, r.query)).rows) }
    : read.reports(r.scope, a, r.query),
);
