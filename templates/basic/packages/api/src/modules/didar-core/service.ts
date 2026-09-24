import { MedusaService } from "@medusajs/framework/utils"

import DidarCatalogSource from "./models/catalog-source"
import DidarMembership from "./models/membership"
import DidarOrganization from "./models/organization"
import DidarPiece from "./models/piece"
import DidarInquiry from "./models/inquiry"
import DidarStaffGrant from "./models/staff-grant"

class DidarCoreService extends MedusaService({
  DidarOrganization,
  DidarMembership,
  DidarCatalogSource,
  DidarPiece,
  DidarInquiry,
  DidarStaffGrant,
}) {}

export default DidarCoreService
