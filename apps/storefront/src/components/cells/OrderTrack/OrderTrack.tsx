import type { HttpTypes } from "@medusajs/types"
import { Card } from "@/components/atoms"

export const OrderTrack = ({ order }: { order: Pick<HttpTypes.StoreOrder, "fulfillments"> }) => {
  const labels = order.fulfillments?.[0]?.labels
  if (!labels?.length) return null

  return (
    <div>
      <h2 className="text-primary label-lg uppercase">Order Tracking</h2>
      <ul className="mt-4">
        {labels.map((item) => (
          <li key={item.id}>
            <a href={item.tracking_number} target="_blank">
              <Card className="px-4 hover:bg-secondary/30">
                {item.tracking_number}
              </Card>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
