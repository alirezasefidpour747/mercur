"use client"

import type { HttpTypes } from "@medusajs/types"

import { Button, Checkbox, Divider } from "@/components/atoms"
import { Modal } from "@/components/molecules"
import { useState } from "react"
import Image from "next/image"
import { convertToLocale } from "@/lib/helpers/money"
import { cn } from "@/lib/utils"

export const OrderCancel = ({ order }: { order: HttpTypes.StoreOrder }) => {
  const [open, setOpen] = useState(false)
  const [selectedItems, setSelectedItems] = useState<HttpTypes.StoreOrderLineItem[]>([])

  const handleCancel = () => {
    console.log("cancel")
  }

  const handleSelectItem = (item: HttpTypes.StoreOrderLineItem) => {
    setSelectedItems((previous) =>
      previous.some((selected) => selected.id === item.id)
        ? previous.filter((selected) => selected.id !== item.id)
        : [...previous, { ...item }]
    )
  }

  const handleChangeQuantity = (item: HttpTypes.StoreOrderLineItem, change: number) => {
    setSelectedItems((previous) => previous.map((selected) =>
      selected.id === item.id
        ? { ...selected, quantity: Math.max(1, Math.min(item.quantity, selected.quantity + change)) }
        : selected
    ))
  }

  return (
    <>
      <div className="md:flex justify-between items-center">
        <div className="mb-4 md:mb-0">
          <h2 className="text-primary label-lg uppercase">Cancel Order</h2>
          <p className="text-secondary label-md max-w-sm">
            Once you place your order, you can cancel it until the seller begins
            preparation for shipment.
          </p>
        </div>
        <Button
          variant="tonal"
          className="uppercase"
          onClick={() => setOpen(true)}
        >
          Cancel
        </Button>
      </div>
      {open && (
        <Modal
          heading="Select items you want to cancel"
          onClose={() => setOpen(false)}
        >
          <div>
            <ul className="px-4">
              {(order.items ?? []).map((item) => {
                const isSelected = selectedItems.some((selected) => selected.id === item.id)
                const itemline = selectedItems.find((i) => i.id === item.id)
                return (
                  <li
                    key={item.id}
                    className={cn(
                      "flex items-center gap-4 p-4 mb-2 rounded-sm",
                      isSelected && "bg-secondary/70"
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      onChange={() => handleSelectItem(item)}
                    />
                    <div className="flex gap-4 w-full">
                      <div className="w-16 rounded-sm border">
                        {item.thumbnail ? (
                          <Image
                            src={item.thumbnail}
                            alt={item.product_title || item.title}
                            width={60}
                            height={60}
                            className="rounded-sm"
                          />
                        ) : (
                          <Image
                            src={"/images/placeholder.svg"}
                            alt={item.product_title || item.title}
                            width={60}
                            height={60}
                            className="opacity-25 scale-75"
                          />
                        )}
                      </div>
                      <div className="grid grid-cols-4 gap-2 w-full">
                        <div className="col-span-2">
                          <p className="text-primary label-md truncate w-full">
                            {item.subtitle}
                          </p>
                          <p className="text-secondary label-sm truncate w-full">
                            {item.title}
                          </p>
                        </div>
                        <div className="flex items-center justify-center">
                          {isSelected && (
                            <div className="flex items-center mt-2">
                              <Button
                                variant="text"
                                className="w-8 h-8 flex items-center justify-center !bg-transparent !hover:bg-secondary"
                                disabled={(itemline?.quantity ?? item.quantity) <= 1}
                                onClick={() => handleChangeQuantity(item, -1)}
                              >
                                -
                              </Button>
                              <div className="text-primary font-medium border rounded-sm w-8 h-8 text-center flex items-center justify-center bg-primary">
                                {itemline?.quantity ?? item.quantity}
                              </div>
                              <Button
                                variant="text"
                                className="w-8 h-8 flex items-center justify-center !bg-transparent !hover:bg-secondary"
                                disabled={(itemline?.quantity ?? item.quantity) >= item.quantity}
                                onClick={() => handleChangeQuantity(item, 1)}
                              >
                                +
                              </Button>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-end">
                          <p className="text-primary label-lg">
                            {convertToLocale({
                              amount: item.total,
                              currency_code: order.currency_code,
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>

            <Divider className="my-4" />
            <div className="px-4">
              <Button className="uppercase w-full" onClick={handleCancel}>
                Request cancelation
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
