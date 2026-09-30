import { defineMiddlewares, authenticate } from "@medusajs/framework/http";

/** Fail closed for every native discovery/mutation route in this P01-only app.
 * Login is under /auth; native self identity and Seller selection remain usable.
 * The extension routes have independent membership/permission checks. */
const boundary = (req: any, res: any, next: any) => {
  const path = req.path.replace(/\/$/, "");
  if (/^\/(store|admin|vendor)\/b2b(?:\/|$)/.test(path)) return next();
  const self =
    req.method === "GET" &&
    ["/admin/users/me", "/vendor/members/me", "/vendor/sellers"].includes(path);
  const select = req.method === "POST" && path === "/vendor/sellers/select";
  if (self || select) return next();
  return res
    .status(403)
    .json({
      code: "P01_ROUTE_DISABLED",
      message: "Use the authorized Didar Product workspace",
    });
};
export default defineMiddlewares({
  routes: [
    { matcher: "/store/*", middlewares: [boundary] },
    { matcher: "/vendor/*", middlewares: [boundary] },
    { matcher: "/admin/*", middlewares: [boundary] },
    {
      matcher: "/store/b2b/*",
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    {
      matcher: "/vendor/b2b/*",
      middlewares: [authenticate("member", ["session", "bearer"])],
    },
    {
      matcher: "/admin/b2b/*",
      middlewares: [authenticate("user", ["session", "bearer"])],
    },
  ],
});
