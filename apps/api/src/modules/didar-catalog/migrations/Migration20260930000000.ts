import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260930000000 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'create table "didar_organization" ("id" text primary key, "kind" text not null, "name" text not null, "seller_id" text, "active" boolean not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null);',
    );
    this.addSql(
      'create unique index "IDX_didar_organization_0" on "didar_organization" (seller_id) where deleted_at is null;',
    );
    this.addSql(
      'create table "didar_membership" ("id" text primary key, "actor_id" text not null, "actor_type" text not null, "organization_id" text not null, "active" boolean not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null);',
    );
    this.addSql(
      'create unique index "IDX_didar_membership_0" on "didar_membership" (actor_id,actor_type,organization_id) where deleted_at is null;',
    );
    this.addSql(
      'create table "didar_grant" ("id" text primary key, "membership_id" text not null, "role" text not null, "permission" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null);',
    );
    this.addSql(
      'create unique index "IDX_didar_grant_0" on "didar_grant" (membership_id,permission) where deleted_at is null;',
    );
    this.addSql(
      'create table "didar_catalog_profile" ("id" text primary key, "product_id" text not null, "variant_id" text not null, "owner_organization_id" text not null, "product_code" text not null, "subcategory_id" text, "root_category_id" text, "karat" integer, "material" text, "technical_description" text, "publication_state" text not null, "version" integer not null, "published_candidate_id" text, "published_at" timestamptz, "public_weight_min" numeric(20,6), "public_weight_max" numeric(20,6), "public_fee_min" numeric(20,6), "public_fee_max" numeric(20,6), "public_sort_name" text, "public_handle" text, "public_search_text" text, "type_id" text, "native_fingerprint" text, "created_by" text not null, "updated_by" text not null, "raw_public_weight_min" jsonb null, "raw_public_weight_max" jsonb null, "raw_public_fee_min" jsonb null, "raw_public_fee_max" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null);',
    );
    this.addSql(
      'create unique index "IDX_didar_catalog_profile_0" on "didar_catalog_profile" (product_id) where deleted_at is null;',
    );
    this.addSql(
      'create unique index "IDX_didar_catalog_profile_1" on "didar_catalog_profile" (product_code) where deleted_at is null;',
    );
    this.addSql(
      'create unique index "IDX_didar_catalog_profile_2" on "didar_catalog_profile" (public_handle) where deleted_at is null;',
    );
    this.addSql(
      'create index "IDX_didar_catalog_profile_3" on "didar_catalog_profile" (publication_state,root_category_id) where deleted_at is null;',
    );
    this.addSql(
      'create index "IDX_didar_catalog_profile_4" on "didar_catalog_profile" (publication_state,subcategory_id) where deleted_at is null;',
    );
    this.addSql(
      'create index "IDX_didar_catalog_profile_5" on "didar_catalog_profile" (karat,material,type_id) where deleted_at is null;',
    );
    this.addSql(
      'create index "IDX_didar_catalog_profile_6" on "didar_catalog_profile" (public_weight_min,public_weight_max) where deleted_at is null;',
    );
    this.addSql(
      'create index "IDX_didar_catalog_profile_7" on "didar_catalog_profile" (public_fee_min,public_fee_max) where deleted_at is null;',
    );
    this.addSql(
      'create index "IDX_didar_catalog_profile_8" on "didar_catalog_profile" (published_at,product_id) where deleted_at is null;',
    );
    this.addSql(
      'create index "IDX_didar_catalog_profile_9" on "didar_catalog_profile" (public_sort_name,product_id) where deleted_at is null;',
    );
    this.addSql(
      'create table "didar_candidate" ("id" text primary key, "product_id" text not null, "owner_organization_id" text not null, "revision" integer not null, "title" text not null, "handle" text not null, "description" text, "technical_description" text, "product_code" text not null, "subcategory_id" text not null, "karat" integer not null, "material" text not null, "type_id" text, "images" jsonb not null, "attribute_value_ids" jsonb not null, "public_weight_min" numeric(20,6), "public_weight_max" numeric(20,6), "public_fee_min" numeric(20,6), "public_fee_max" numeric(20,6), "public_terms_approved_by" text, "public_terms_approved_at" timestamptz, "native_change_id" text, "created_by" text not null, "raw_public_weight_min" jsonb null, "raw_public_weight_max" jsonb null, "raw_public_fee_min" jsonb null, "raw_public_fee_max" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null);',
    );
    this.addSql(
      'create unique index "IDX_didar_candidate_0" on "didar_candidate" (product_id,revision) where deleted_at is null;',
    );
    this.addSql(
      'create index "IDX_didar_candidate_1" on "didar_candidate" (owner_organization_id,created_at) where deleted_at is null;',
    );
    this.addSql(
      'create table "didar_offer_profile" ("id" text primary key, "offer_id" text not null, "product_id" text not null, "seller_id" text not null, "owner_organization_id" text not null, "status" text not null, "version" integer not null, "active_revision_id" text, "created_by" text not null, "updated_by" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null);',
    );
    this.addSql(
      'create unique index "IDX_didar_offer_profile_0" on "didar_offer_profile" (offer_id) where deleted_at is null;',
    );
    this.addSql(
      'create index "IDX_didar_offer_profile_1" on "didar_offer_profile" (product_id,seller_id) where deleted_at is null;',
    );
    this.addSql(
      'create index "IDX_didar_offer_profile_2" on "didar_offer_profile" (owner_organization_id,status) where deleted_at is null;',
    );
    this.addSql(
      'create table "didar_offer_revision" ("id" text primary key, "offer_id" text not null, "revision" integer not null, "supplier_product_code" text, "weight_type" text not null, "exact_weight" numeric(20,6), "weight_min" numeric(20,6), "weight_max" numeric(20,6), "making_fee_type" text not null, "making_fee_value" numeric(20,6), "making_fee_min" numeric(20,6), "making_fee_max" numeric(20,6), "availability_type" text not null, "lead_time_days" integer, "created_by" text not null, "actor_organization_id" text not null, "owner_organization_id" text not null, "raw_exact_weight" jsonb null, "raw_weight_min" jsonb null, "raw_weight_max" jsonb null, "raw_making_fee_value" jsonb null, "raw_making_fee_min" jsonb null, "raw_making_fee_max" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null);',
    );
    this.addSql(
      'create unique index "IDX_didar_offer_revision_0" on "didar_offer_revision" (offer_id,revision) where deleted_at is null;',
    );
    this.addSql(
      'create index "IDX_didar_offer_revision_1" on "didar_offer_revision" (weight_min,weight_max) where deleted_at is null;',
    );
    this.addSql(
      'create index "IDX_didar_offer_revision_2" on "didar_offer_revision" (making_fee_min,making_fee_max) where deleted_at is null;',
    );
    this.addSql(
      'create index "IDX_didar_offer_revision_3" on "didar_offer_revision" (owner_organization_id,created_at) where deleted_at is null;',
    );
    this.addSql(
      'create table "didar_submission" ("id" text primary key, "product_id" text not null, "candidate_id" text not null, "owner_organization_id" text not null, "state" text not null, "version" integer not null, "submitted_at" timestamptz, "submitted_by" text, "reviewed_at" timestamptz, "reviewed_by" text, "reason" text, "created_by" text not null, "submission_kind" text not null, "previous_submission_id" text, "superseded_at" timestamptz, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null);',
    );
    this.addSql(
      'create index "IDX_didar_submission_0" on "didar_submission" (state,submitted_at,id) where deleted_at is null;',
    );
    this.addSql(
      'create index "IDX_didar_submission_1" on "didar_submission" (owner_organization_id,state) where deleted_at is null;',
    );
    this.addSql(
      'create index "IDX_didar_submission_2" on "didar_submission" (product_id,version) where deleted_at is null;',
    );
    this.addSql(
      'create table "didar_submission_offer" ("id" text primary key, "submission_id" text not null, "offer_id" text not null, "revision_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null);',
    );
    this.addSql(
      'create unique index "IDX_didar_submission_offer_0" on "didar_submission_offer" (submission_id,offer_id) where deleted_at is null;',
    );
    this.addSql(
      'create table "didar_catalog_event" ("id" text primary key, "entity_type" text not null, "entity_id" text not null, "category_id" text, "subcategory_id" text, "product_id" text, "offer_id" text, "submission_id" text, "candidate_id" text, "event_code" text not null, "from_state" text, "to_state" text, "actor_id" text not null, "actor_type" text not null, "actor_organization_id" text not null, "owner_organization_id" text not null, "role_context" text not null, "on_behalf_of" text, "reason" text, "command_id" text not null, "occurred_at" timestamptz not null, "details" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null);',
    );
    this.addSql(
      'create unique index "IDX_didar_catalog_event_0" on "didar_catalog_event" (command_id,event_code,product_id,offer_id) where deleted_at is null;',
    );
    this.addSql(
      'create index "IDX_didar_catalog_event_1" on "didar_catalog_event" (entity_type,entity_id,occurred_at) where deleted_at is null;',
    );
    this.addSql(
      'create index "IDX_didar_catalog_event_2" on "didar_catalog_event" (product_id,occurred_at) where deleted_at is null;',
    );
    this.addSql(
      'create index "IDX_didar_catalog_event_3" on "didar_catalog_event" (actor_organization_id,occurred_at) where deleted_at is null;',
    );
    this.addSql(
      'create index "IDX_didar_catalog_event_4" on "didar_catalog_event" (actor_id,occurred_at) where deleted_at is null;',
    );
    this.addSql(
      'create index "IDX_didar_catalog_event_5" on "didar_catalog_event" (owner_organization_id,occurred_at) where deleted_at is null;',
    );
    this.addSql(
      'create table "didar_command_receipt" ("id" text primary key, "actor_id" text not null, "organization_id" text not null, "resource_key" text not null, "idempotency_key" text not null, "payload_hash" text not null, "state" text not null, "result" jsonb, "failure" text, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null);',
    );
    this.addSql(
      'create unique index "IDX_didar_command_receipt_0" on "didar_command_receipt" (actor_id,organization_id,resource_key,idempotency_key) where deleted_at is null;',
    );
    this.addSql(
      'create table "didar_attribute_approval" ("id" text primary key, "attribute_id" text not null, "handle" text not null, "approved_by" text not null, "approved_at" timestamptz not null, "active" boolean not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null);',
    );
    this.addSql(
      'create unique index "IDX_didar_attribute_approval_0" on "didar_attribute_approval" (attribute_id) where deleted_at is null;',
    );
    this.addSql(
      'create unique index "IDX_didar_attribute_approval_1" on "didar_attribute_approval" (handle) where deleted_at is null;',
    );
    this.addSql(
      'create table "didar_candidate_attribute" ("id" text primary key, "candidate_id" text not null, "attribute_id" text not null, "value_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null);',
    );
    this.addSql(
      'create unique index "IDX_didar_candidate_attribute_0" on "didar_candidate_attribute" (candidate_id,attribute_id,value_id) where deleted_at is null;',
    );
    this.addSql(
      'create table "didar_public_attribute" ("id" text primary key, "product_id" text not null, "attribute_id" text not null, "value_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null);',
    );
    this.addSql(
      'create unique index "IDX_didar_public_attribute_0" on "didar_public_attribute" (product_id,attribute_id,value_id) where deleted_at is null;',
    );
    this.addSql(
      'create index "IDX_didar_public_attribute_1" on "didar_public_attribute" (attribute_id,value_id,product_id) where deleted_at is null;',
    );
    this.addSql(
      "create function didar_catalog_profile_numeric_sync() returns trigger language plpgsql as $$ begin NEW.raw_public_weight_min := case when NEW.public_weight_min is null then null else jsonb_build_object('value',NEW.public_weight_min::text,'precision',20) end; NEW.raw_public_weight_max := case when NEW.public_weight_max is null then null else jsonb_build_object('value',NEW.public_weight_max::text,'precision',20) end; NEW.raw_public_fee_min := case when NEW.public_fee_min is null then null else jsonb_build_object('value',NEW.public_fee_min::text,'precision',20) end; NEW.raw_public_fee_max := case when NEW.public_fee_max is null then null else jsonb_build_object('value',NEW.public_fee_max::text,'precision',20) end; return NEW; end $$;",
    );
    this.addSql(
      "create trigger didar_catalog_profile_numeric_sync before insert or update on didar_catalog_profile for each row execute function didar_catalog_profile_numeric_sync();",
    );
    this.addSql(
      "create function didar_candidate_numeric_sync() returns trigger language plpgsql as $$ begin NEW.raw_public_weight_min := case when NEW.public_weight_min is null then null else jsonb_build_object('value',NEW.public_weight_min::text,'precision',20) end; NEW.raw_public_weight_max := case when NEW.public_weight_max is null then null else jsonb_build_object('value',NEW.public_weight_max::text,'precision',20) end; NEW.raw_public_fee_min := case when NEW.public_fee_min is null then null else jsonb_build_object('value',NEW.public_fee_min::text,'precision',20) end; NEW.raw_public_fee_max := case when NEW.public_fee_max is null then null else jsonb_build_object('value',NEW.public_fee_max::text,'precision',20) end; return NEW; end $$;",
    );
    this.addSql(
      "create trigger didar_candidate_numeric_sync before insert or update on didar_candidate for each row execute function didar_candidate_numeric_sync();",
    );
    this.addSql(
      "create function didar_offer_revision_numeric_sync() returns trigger language plpgsql as $$ begin NEW.raw_exact_weight := case when NEW.exact_weight is null then null else jsonb_build_object('value',NEW.exact_weight::text,'precision',20) end; NEW.raw_weight_min := case when NEW.weight_min is null then null else jsonb_build_object('value',NEW.weight_min::text,'precision',20) end; NEW.raw_weight_max := case when NEW.weight_max is null then null else jsonb_build_object('value',NEW.weight_max::text,'precision',20) end; NEW.raw_making_fee_value := case when NEW.making_fee_value is null then null else jsonb_build_object('value',NEW.making_fee_value::text,'precision',20) end; NEW.raw_making_fee_min := case when NEW.making_fee_min is null then null else jsonb_build_object('value',NEW.making_fee_min::text,'precision',20) end; NEW.raw_making_fee_max := case when NEW.making_fee_max is null then null else jsonb_build_object('value',NEW.making_fee_max::text,'precision',20) end; return NEW; end $$;",
    );
    this.addSql(
      "create trigger didar_offer_revision_numeric_sync before insert or update on didar_offer_revision for each row execute function didar_offer_revision_numeric_sync();",
    );
    this.addSql(
      "alter table didar_catalog_profile add constraint didar_product_identity unique(product_id);",
    );
    this.addSql(
      "alter table didar_offer_profile add constraint didar_offer_identity unique(offer_id);",
    );
    this.addSql(
      "alter table didar_organization add constraint didar_org_kind check (kind in ('DIDAR','SUPPLIER','RETAILER') and ((kind = 'SUPPLIER') = (seller_id is not null)));",
    );
    this.addSql(
      "alter table didar_membership add constraint didar_member_org foreign key (organization_id) references didar_organization(id);",
    );
    this.addSql(
      "alter table didar_grant add constraint didar_grant_member foreign key (membership_id) references didar_membership(id);",
    );
    this.addSql(
      "alter table didar_candidate add constraint didar_candidate_profile foreign key (product_id) references didar_catalog_profile(product_id);",
    );
    this.addSql(
      "alter table didar_offer_revision add constraint didar_revision_offer foreign key (offer_id) references didar_offer_profile(offer_id);",
    );
    this.addSql(
      "alter table didar_submission add constraint didar_submission_candidate foreign key (candidate_id) references didar_candidate(id);",
    );
    this.addSql(
      "alter table didar_submission_offer add constraint didar_submission_offer_submission foreign key (submission_id) references didar_submission(id);",
    );
    this.addSql(
      "alter table didar_submission_offer add constraint didar_submission_offer_revision foreign key (revision_id) references didar_offer_revision(id);",
    );
    this.addSql(
      "alter table didar_offer_revision add constraint didar_percent_only check (making_fee_type in ('PERCENT','RANGE_PERCENT'));",
    );
    this.addSql(
      "alter table didar_offer_revision add constraint didar_offer_weights check ((weight_type = 'EXACT' and exact_weight is not null and exact_weight > 0 and weight_min is null and weight_max is null) or (weight_type = 'RANGE' and exact_weight is null and weight_min is not null and weight_max is not null and weight_min > 0 and weight_max >= weight_min));",
    );
    this.addSql(
      "alter table didar_offer_revision add constraint didar_offer_fees check ((making_fee_type = 'PERCENT' and making_fee_value is not null and making_fee_value >= 0 and making_fee_min is null and making_fee_max is null) or (making_fee_type = 'RANGE_PERCENT' and making_fee_value is null and making_fee_min is not null and making_fee_max is not null and making_fee_min >= 0 and making_fee_max >= making_fee_min));",
    );
    this.addSql(
      "alter table didar_offer_revision add constraint didar_offer_availability check (availability_type in ('AVAILABLE','MADE_TO_ORDER','UNAVAILABLE') and (lead_time_days is null or lead_time_days >= 0));",
    );
    this.addSql(
      "alter table didar_submission add constraint didar_submission_state check (state in ('DRAFT','SUBMITTED','CHANGES_REQUESTED','REJECTED','APPROVED','PUBLISHED','INACTIVE'));",
    );
    this.addSql(
      "create unique index didar_one_open_submission on didar_submission(product_id,owner_organization_id) where deleted_at is null and superseded_at is null and state in ('DRAFT','SUBMITTED','CHANGES_REQUESTED','APPROVED');",
    );
    this.addSql(
      "create index didar_catalog_search on didar_catalog_profile using gin (to_tsvector('simple',coalesce(public_search_text,'')));",
    );
    this.addSql(
      "create or replace function didar_immutable_history() returns trigger language plpgsql as $$ begin raise exception 'Didar reviewed history is immutable'; end $$;",
    );
    this.addSql(
      "create trigger didar_event_immutable before update or delete on didar_catalog_event for each row execute function didar_immutable_history();",
    );
    this.addSql(
      "create trigger didar_offer_revision_immutable before update or delete on didar_offer_revision for each row execute function didar_immutable_history();",
    );
    this.addSql(
      "create trigger didar_candidate_immutable before update or delete on didar_candidate for each row execute function didar_immutable_history();",
    );
  }
  async down(): Promise<void> {
    this.addSql("drop table if exists didar_public_attribute cascade;");
    this.addSql("drop table if exists didar_candidate_attribute cascade;");
    this.addSql("drop table if exists didar_attribute_approval cascade;");
    this.addSql("drop table if exists didar_command_receipt cascade;");
    this.addSql("drop table if exists didar_catalog_event cascade;");
    this.addSql("drop table if exists didar_submission_offer cascade;");
    this.addSql("drop table if exists didar_submission cascade;");
    this.addSql("drop table if exists didar_offer_revision cascade;");
    this.addSql("drop table if exists didar_offer_profile cascade;");
    this.addSql("drop table if exists didar_candidate cascade;");
    this.addSql("drop table if exists didar_catalog_profile cascade;");
    this.addSql("drop table if exists didar_grant cascade;");
    this.addSql("drop table if exists didar_membership cascade;");
    this.addSql("drop table if exists didar_organization cascade;");
    this.addSql("drop function if exists didar_immutable_history();");
    this.addSql(
      "drop function if exists didar_catalog_profile_numeric_sync();",
    );
    this.addSql("drop function if exists didar_candidate_numeric_sync();");
    this.addSql("drop function if exists didar_offer_revision_numeric_sync();");
  }
}
