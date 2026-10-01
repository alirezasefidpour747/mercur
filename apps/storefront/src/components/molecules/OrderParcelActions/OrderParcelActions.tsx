import type { HttpTypes } from "@medusajs/types"
import { OrderReturn } from "@/components/cells/OrderReturn/OrderReturn"
import { OrderTrack } from "@/components/cells/OrderTrack/OrderTrack"

export const OrderParcelActions = ({ order }: { order: Pick<HttpTypes.StoreOrder, "id" | "fulfillment_status" | "fulfillments"> }) => {
  if (order.fulfillment_status === "delivered")
    return <OrderReturn order={order} />

  if (order.fulfillment_status === "shipped")
    return <OrderTrack order={order} />

  return null
}
