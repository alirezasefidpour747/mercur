import {
  CartItemsFooter,
  CartItemsHeader,
  CartItemsProducts,
} from "@/components/cells"
import { HttpTypes } from "@medusajs/types"
import { EmptyCart } from "./EmptyCart"

import type { ComponentProps } from "react"
import type { OfferDTO } from "@mercurjs/types"

type CartItemWithOffer = HttpTypes.StoreCartLineItem & { offer?: OfferDTO | null }
type SellerItemGroup = {
  seller: ComponentProps<typeof CartItemsHeader>["seller"]
  items: HttpTypes.StoreCartLineItem[]
}

export const CartItems = ({ cart }: { cart: HttpTypes.StoreCart | null }) => {
  if (!cart) return null

  const groupedItems = groupItemsBySeller(cart)

  if (!Object.keys(groupedItems).length) return <EmptyCart />

  return Object.keys(groupedItems).map((key) => (
    <div key={key} className="mb-4" data-testid={`cart-items-seller-${key}`}>
      <CartItemsHeader seller={groupedItems[key]?.seller} />
      <CartItemsProducts
        products={groupedItems[key].items || []}
        currency_code={cart.currency_code}
      />
      <CartItemsFooter
        currency_code={cart.currency_code}
        price={cart.shipping_subtotal}
      />
    </div>
  ))
}

function groupItemsBySeller(cart: HttpTypes.StoreCart) {
  const groupedBySeller: Record<string, SellerItemGroup> = {}

  cart.items?.forEach((item: CartItemWithOffer) => {
    const seller = item.offer?.seller
    if (seller) {
      if (!groupedBySeller[seller.id]) {
        groupedBySeller[seller.id] = {
          seller: { ...seller, photo: "photo" in seller && typeof seller.photo === "string"
            ? seller.photo
            : seller.logo ?? "" },
          items: [],
        }
      }
      groupedBySeller[seller.id].items.push(item)
    } else {
      if (!groupedBySeller["fleek"]) {
        groupedBySeller["fleek"] = {
          seller: {
            name: "Fleek",
            id: "fleek",
            photo: "/Logo.svg",
            created_at: new Date(),
          },
          items: [],
        }
      }
      groupedBySeller["fleek"].items.push(item)
    }
  })

  return groupedBySeller
}
