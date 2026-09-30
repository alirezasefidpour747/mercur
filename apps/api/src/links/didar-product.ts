import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";
import DidarCatalog from "../modules/didar-catalog";
export default defineLink(
  { linkable: DidarCatalog.linkable.didarCatalogProfile, field: "product_id" },
  ProductModule.linkable.product,
  { readOnly: true },
);
