import { authorize } from "../../modules/didar-catalog/authorization";
import { CatalogError } from "../../modules/didar-catalog/domain";
export function endpoint(fn: (req: any, actor: any) => Promise<any>) {
  return async (req: any, res: any) => {
    res.setHeader("Cache-Control", "private, no-store");
    try {
      const actor = await authorize(req),
        data = await fn(req, actor);
      if (data?.csv !== undefined) {
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader(
          "Content-Disposition",
          'attachment; filename="didar-products.csv"',
        );
        return res.send(data.csv);
      }
      return res.json(data);
    } catch (error) {
      if (error instanceof CatalogError)
        return res
          .status(error.status)
          .json({ code: error.code, message: error.message });
      req.scope.resolve("logger").error(error);
      return res
        .status(503)
        .json({
          code: "CATALOG_UNAVAILABLE",
          message: "Product service is unavailable. Retry after recovery.",
        });
    }
  };
}
