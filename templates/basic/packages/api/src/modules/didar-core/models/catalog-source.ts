import { model } from "@medusajs/framework/utils"

// Public URLs identify source records; neither the URL nor its slug is a SKU.
const DidarCatalogSource = model.define("didar_catalog_source", {
  id: model.id().primaryKey(),
  source_url: model.text().unique(),
  source_slug: model.text(),
  medusa_product_id: model.text().nullable(),
  review_status: model.enum(["staged", "verified"]).default("staged"),
  reviewed_at: model.dateTime().nullable(),
})

export default DidarCatalogSource
