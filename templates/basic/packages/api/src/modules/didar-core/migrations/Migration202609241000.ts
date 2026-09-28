import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration202609241000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`create table if not exists "didar_inquiry" (
      "id" text not null, "organization_id" text not null,
      "created_by_customer_id" text not null, "medusa_product_id" text not null,
      "message" text not null, "status" text not null default 'submitted',
      "answer" text null, "reviewed_by_user_id" text null,
      "reviewed_at" timestamptz null,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now(),
      "deleted_at" timestamptz null,
      constraint "didar_inquiry_pkey" primary key ("id"),
      constraint "didar_inquiry_status_check" check ("status" in ('submitted', 'under_review', 'answered'))
    );`)
    this.addSql(`create index if not exists "IDX_didar_inquiry_org_created" on "didar_inquiry" ("organization_id", "created_at");`)

    this.addSql(`create table if not exists "didar_staff_grant" (
      "id" text not null, "user_id" text not null,
      "capability" text not null, "is_active" boolean not null default true,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now(),
      "deleted_at" timestamptz null,
      constraint "didar_staff_grant_pkey" primary key ("id")
    );`)
    this.addSql(`create unique index if not exists "IDX_didar_staff_grant_user_capability" on "didar_staff_grant" ("user_id", "capability");`)
  }

  async down(): Promise<void> {
    this.addSql(`drop table if exists "didar_staff_grant";`)
    this.addSql(`drop table if exists "didar_inquiry";`)
  }
}
