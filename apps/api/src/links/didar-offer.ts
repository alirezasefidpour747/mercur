import { defineLink } from "@medusajs/framework/utils";
import OfferModule from "@mercurjs/core/modules/offer";
import DidarCatalog from "../modules/didar-catalog";
export default defineLink(
  { linkable: DidarCatalog.linkable.didarOfferProfile, field: "offer_id" },
  OfferModule.linkable.offer,
  { readOnly: true },
);
