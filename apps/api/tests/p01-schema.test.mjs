import test from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import ts from "typescript";
function migrationSQL(source, method) {
  const ast = ts.createSourceFile(
      "migration.ts",
      source,
      ts.ScriptTarget.Latest,
      true,
    ),
    statements = [];
  function visit(node) {
    if (ts.isMethodDeclaration(node) && node.name.getText(ast) === method) {
      function calls(child) {
        if (
          ts.isCallExpression(child) &&
          ts.isPropertyAccessExpression(child.expression) &&
          child.expression.name.text === "addSql" &&
          ts.isStringLiteral(child.arguments[0])
        )
          statements.push(child.arguments[0].text);
        ts.forEachChild(child, calls);
      }
      ts.forEachChild(node, calls);
    } else ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(statements.length > 0, `${method} migration SQL not found`);
  return statements.join("\n");
}

// PostgreSQL engine tests of the checked-in extension migration only.
// These do not replace Medusa migration/API, multi-session concurrency or native Offer-service evidence.
test("extension migration, numeric fields, immutable history and persistence", async () => {
  const dir = await mkdtemp(join(tmpdir(), "didar-p01-db-"));
  let db = new PGlite(dir);
  try {
    const source = await readFile(
      new URL(
        "../src/modules/didar-catalog/migrations/Migration20260930000000.ts",
        import.meta.url,
      ),
      "utf8",
    );
    const sql = migrationSQL(source, "up");
    assert.ok(sql.includes("didar_percent_only"));
    await db.exec(sql);
    const tables = (
      await db.query(
        "select tablename from pg_tables where schemaname='public' and tablename like 'didar_%' order by tablename",
      )
    ).rows;
    assert.equal(tables.length, 14);
    await db.exec(
      "insert into didar_organization(id,kind,name,seller_id,active) values ('org_supplier','SUPPLIER','Supplier A','sel_native',true)",
    );
    await db.exec(
      "insert into didar_catalog_profile(id,product_id,variant_id,owner_organization_id,product_code,publication_state,version,created_by,updated_by,public_weight_min,public_weight_max) values ('cp','prod_native','variant_native','org_supplier','D-1','DRAFT',1,'mem_native','mem_native',6,9)",
    );
    await db.exec(
      "insert into didar_offer_profile(id,offer_id,product_id,seller_id,owner_organization_id,status,version,created_by,updated_by) values ('op','offer_native','prod_native','sel_native','org_supplier','INACTIVE',1,'mem_native','mem_native')",
    );
    const insert = (id, mode, fields) =>
      `insert into didar_offer_revision(id,offer_id,revision,weight_type,exact_weight,weight_min,weight_max,making_fee_type,making_fee_value,making_fee_min,making_fee_max,availability_type,created_by,actor_organization_id,owner_organization_id) values ('${id}','offer_native',${id === "valid" ? 1 : 2},'RANGE',null,6,9,'${mode}',${fields},'MADE_TO_ORDER','mem_native','org_supplier','org_supplier')`;
    await assert.rejects(
      db.exec(insert("fixed", "FIXED", "14,null,null")),
      /check constraint/,
    );
    await assert.rejects(
      db.exec(insert("missing", "PERCENT", "null,null,null")),
      /didar_offer_fees/,
    );
    await db.exec(insert("valid", "RANGE_PERCENT", "null,12.000001,16"));
    const row = (
      await db.query(
        "select making_fee_min,raw_making_fee_min from didar_offer_revision",
      )
    ).rows[0];
    assert.equal(row.making_fee_min, "12.000001");
    assert.equal(row.raw_making_fee_min.value, "12.000001");
    await assert.rejects(
      db.exec(
        "update didar_offer_revision set making_fee_min=1 where id='valid'",
      ),
      /immutable/,
    );
    await db.exec(
      "insert into didar_candidate(id,product_id,owner_organization_id,revision,title,handle,product_code,subcategory_id,karat,material,images,attribute_value_ids,created_by) values ('candidate','prod_native','org_supplier',1,'Gold','gold','D-1','pcat_native',18,'gold','[]','[]','mem_native')",
    );
    await assert.rejects(
      db.exec(
        "update didar_candidate set title='rewritten' where id='candidate'",
      ),
      /immutable/,
    );
    await db.exec(
      "insert into didar_submission(id,product_id,candidate_id,owner_organization_id,state,version,created_by,submission_kind) values ('review','prod_native','candidate','org_supplier','SUBMITTED',1,'mem_native','PRODUCT')",
    );
    await assert.rejects(
      db.exec(
        "insert into didar_submission(id,product_id,candidate_id,owner_organization_id,state,version,created_by,submission_kind) values ('duplicate','prod_native','candidate','org_supplier','DRAFT',1,'mem_native','PRODUCT')",
      ),
      /didar_one_open_submission/,
    );
    const indexes = (
      await db.query(
        "select indexname from pg_indexes where tablename='didar_catalog_profile'",
      )
    ).rows;
    assert.ok(indexes.some((i) => i.indexname === "didar_catalog_search"));
    const count = (
      await db.query(
        "select count(distinct p.product_id) as products,count(distinct o.offer_id) as offers from didar_catalog_profile p join didar_offer_profile o on o.product_id=p.product_id",
      )
    ).rows[0];
    assert.equal(Number(count.products), 1);
    assert.equal(Number(count.offers), 1);
    await db.close();
    db = new PGlite(dir);
    assert.equal(
      (await db.query("select product_code from didar_catalog_profile")).rows[0]
        .product_code,
      "D-1",
    );
    const drop = migrationSQL(source, "down");
    await db.exec(drop);
    assert.equal(
      (
        await db.query(
          "select tablename from pg_tables where schemaname='public' and tablename like 'didar_%'",
        )
      ).rows.length,
      0,
    );
  } finally {
    await db.close();
    await rm(dir, { recursive: true, force: true });
  }
});
