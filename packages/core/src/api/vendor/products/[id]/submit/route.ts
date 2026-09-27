import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
  ProductStatus,
} from "@medusajs/framework/utils"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"
import { HttpTypes } from "@mercurjs/types"

import { getSellerOwnedProductIds } from "../../helpers"
import { assertStoredProductMeetsDidarGoldStandard } from "../../validate-didar-gold-product"
import { enrichProductAttributes } from "../../../../utils"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorProductResponse>
) => {
  const productId = req.params.id
  const sellerId = req.seller_context!.seller_id
  const ownedProductIds = await getSellerOwnedProductIds(req.scope, sellerId)

  if (!ownedProductIds.includes(productId)) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product with id ${productId} was not found`
    )
  }

  await assertStoredProductMeetsDidarGoldStandard(req.scope, productId)

  await updateProductsWorkflow(req.scope).run({
    input: {
      selector: { id: productId },
      update: { status: ProductStatus.PROPOSED },
    },
  })

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [product],
  } = await query.graph({
    entity: "product",
    fields: ["*", "images.*", "categories.*", "variants.*"],
    filters: { id: productId },
  })
  await enrichProductAttributes(req.scope, [product])

  res.json({ product } as HttpTypes.VendorProductResponse)
}

