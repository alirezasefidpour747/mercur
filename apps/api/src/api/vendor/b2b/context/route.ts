import { endpoint } from "../../../b2b/endpoint";
export const GET = endpoint(async (r, a) => ({
  actor: {
    id: a.id,
    type: a.type,
    organization_id: a.organization_id,
    kind: a.kind,
  },
  permissions: a.permissions,
  roles: a.roles,
}));
