import type { HttpTypes } from "@medusajs/types"
import { Card } from "@/components/atoms"

export const OrderTrack = ({ order }: { order: Pick<HttpTypes.StoreOrder, "fulfillments"> }) => {
  const fulfillment = order.fulfillments?.[0]
  // Store DTOs do not promise label expansions. Only render verified response data.
  if (!fulfillment || !("labels" in fulfillment) || !Array.isArray(fulfillment.labels)) {
    return null
  }

  const labels = fulfillment.labels.filter(
    (label: unknown): label is { id: string; tracking_number: string } =>
      typeof label === "object" &&
      label !== null &&
      "id" in label &&
      typeof label.id === "string" &&
      "tracking_number" in label &&
      typeof label.tracking_number === "string"
  )
  if (!labels.length) return null

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
