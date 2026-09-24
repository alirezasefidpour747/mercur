import { MedusaService } from "@medusajs/framework/utils"

import DidarCatalogSource from "./models/catalog-source"
import DidarMembership from "./models/membership"
import DidarOrganization from "./models/organization"
import DidarPiece from "./models/piece"

class DidarCoreService extends MedusaService({
  DidarOrganization,
  DidarMembership,
  DidarCatalogSource,
  DidarPiece,
}) {}

export default DidarCoreService
