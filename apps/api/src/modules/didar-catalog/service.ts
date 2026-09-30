import {
  InjectManager,
  MedusaContext,
  MedusaService,
} from "@medusajs/framework/utils";
import type { Context } from "@medusajs/framework/types";
import type { SqlEntityManager } from "@medusajs/framework/mikro-orm/postgresql";
import * as models from "./models";

export default class DidarCatalogService extends MedusaService(models) {
  @InjectManager()
  async database<T>(
    fn: (knex: any) => Promise<T>,
    @MedusaContext() context: Context = {},
  ): Promise<T> {
    const repository = (
      this as unknown as {
        baseRepository_: { getActiveManager<U>(context: Context): U };
      }
    ).baseRepository_;
    return fn(repository.getActiveManager<SqlEntityManager>(context).getKnex());
  }
}
