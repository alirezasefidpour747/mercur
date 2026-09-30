import { Module } from "@medusajs/framework/utils";
import DidarCatalogService from "./service";
export const DIDAR_CATALOG = "didar_catalog";
export default Module(DIDAR_CATALOG, { service: DidarCatalogService });
