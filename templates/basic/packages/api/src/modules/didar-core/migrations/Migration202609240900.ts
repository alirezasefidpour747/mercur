import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration202609240900 extends Migration {
  async up(): Promise<void> {
    this.addSql(`create table if not exists "didar_organization" (
      "id" text not null, "kind" text not null,
      "display_name" text not null,
      "approval_status" text not null default 'pending',
      "reviewed_at" timestamptz null, "reviewed_by" text null,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now(),
      "deleted_at" timestamptz null,
      constraint "didar_organization_pkey" primary key ("id"),
      constraint "didar_organization_kind_check" check ("kind" in ('retailer', 'supplier', 'wholesaler')),
      constraint "didar_organization_status_check" check ("approval_status" in ('pending', 'approved', 'rejected'))
    );`)

    this.addSql(`create table if not exists "didar_membership" (
      "id" text not null, "organization_id" text not null,
      "actor_type" text not null, "actor_id" text not null,
      "business_role" text null, "is_active" boolean not null default true,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now(),
      "deleted_at" timestamptz null,
      constraint "didar_membership_pkey" primary key ("id"),
      constraint "didar_membership_actor_type_check" check ("actor_type" in ('customer', 'seller', 'staff'))
    );`)
    this.addSql(`create unique index if not exists "IDX_didar_membership_actor_org" on "didar_membership" ("organization_id", "actor_type", "actor_id");`)

    this.addSql(`create table if not exists "didar_catalog_source" (
      "id" text not null, "source_url" text not null,
      "source_slug" text not null, "medusa_product_id" text null,
      "review_status" text not null default 'staged',
      "reviewed_at" timestamptz null,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now(),
      "deleted_at" timestamptz null,
      constraint "didar_catalog_source_pkey" primary key ("id"),
      constraint "didar_catalog_source_status_check" check ("review_status" in ('staged', 'verified'))
    );`)
    this.addSql(`create unique index if not exists "IDX_didar_catalog_source_url" on "didar_catalog_source" ("source_url");`)

    this.addSql(`create table if not exists "didar_piece" (
      "id" text not null, "uid" text not null,
      "medusa_variant_id" text not null,
      "status" text not null default 'pending_qc',
      "weight_mg" integer null,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now(),
      "deleted_at" timestamptz null,
      constraint "didar_piece_pkey" primary key ("id"),
      constraint "didar_piece_status_check" check ("status" in ('pending_qc', 'available', 'reserved', 'assigned', 'delivered', 'returned')),
      constraint "didar_piece_weight_check" check ("weight_mg" is null or "weight_mg" > 0)
    );`)
    this.addSql(`create unique index if not exists "IDX_didar_piece_uid" on "didar_piece" ("uid");`)
  }

  async down(): Promise<void> {
    this.addSql(`drop table if exists "didar_piece";`)
    this.addSql(`drop table if exists "didar_catalog_source";`)
    this.addSql(`drop table if exists "didar_membership";`)
    this.addSql(`drop table if exists "didar_organization";`)
  }
}
