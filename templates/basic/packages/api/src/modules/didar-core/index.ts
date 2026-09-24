import { Module } from "@medusajs/framework/utils"

import DidarCoreService from "./service"

export const DIDAR_CORE_MODULE = "didar_core"

export default Module(DIDAR_CORE_MODULE, { service: DidarCoreService })
