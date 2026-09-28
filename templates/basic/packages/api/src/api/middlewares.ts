import { authenticate, defineMiddlewares } from "@medusajs/framework/http"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/didar/inquiries*",
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    {
      matcher: "/admin/didar/inquiries*",
      middlewares: [authenticate("user", ["session", "bearer"])],
    },
  ],
})
