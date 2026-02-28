import { Migration } from '@mikro-orm/migrations';

export class Migration20260228132301 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "event" ("id" uuid not null default gen_random_uuid(), "created_at" timestamptz not null, "updated_at" timestamptz not null, "title" varchar(255) not null, constraint "event_pkey" primary key ("id"));`);

    this.addSql(`create table "seat_tier" ("id" uuid not null default gen_random_uuid(), "created_at" timestamptz not null, "updated_at" timestamptz not null, "event_id" uuid not null, "name" varchar(255) not null, "price" numeric(12,2) not null, constraint "seat_tier_pkey" primary key ("id"));`);

    this.addSql(`create table "seat" ("id" uuid not null default gen_random_uuid(), "created_at" timestamptz not null, "updated_at" timestamptz not null, "seat_tier_id" uuid not null, "row" varchar(255) not null, "number" int not null, "status" varchar(255) not null default 'AVAILABLE', "version" int not null default 1, constraint "seat_pkey" primary key ("id"));`);

    this.addSql(`create table "user" ("id" uuid not null default gen_random_uuid(), "created_at" timestamptz not null, "updated_at" timestamptz not null, "email" varchar(255) not null, constraint "user_pkey" primary key ("id"));`);
    this.addSql(`alter table "user" add constraint "user_email_unique" unique ("email");`);

    this.addSql(`create table "booking" ("id" uuid not null default gen_random_uuid(), "created_at" timestamptz not null, "updated_at" timestamptz not null, "user_id" uuid not null, "seat_id" uuid not null, "status" varchar(255) not null default 'PENDING', "expires_at" timestamptz not null, constraint "booking_pkey" primary key ("id"));`);

    this.addSql(`alter table "seat_tier" add constraint "seat_tier_event_id_foreign" foreign key ("event_id") references "event" ("id") on update cascade;`);

    this.addSql(`alter table "seat" add constraint "seat_seat_tier_id_foreign" foreign key ("seat_tier_id") references "seat_tier" ("id") on update cascade;`);

    this.addSql(`alter table "booking" add constraint "booking_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade;`);
    this.addSql(`alter table "booking" add constraint "booking_seat_id_foreign" foreign key ("seat_id") references "seat" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "seat_tier" drop constraint "seat_tier_event_id_foreign";`);

    this.addSql(`alter table "seat" drop constraint "seat_seat_tier_id_foreign";`);

    this.addSql(`alter table "booking" drop constraint "booking_seat_id_foreign";`);

    this.addSql(`alter table "booking" drop constraint "booking_user_id_foreign";`);

    this.addSql(`drop table if exists "event" cascade;`);

    this.addSql(`drop table if exists "seat_tier" cascade;`);

    this.addSql(`drop table if exists "seat" cascade;`);

    this.addSql(`drop table if exists "user" cascade;`);

    this.addSql(`drop table if exists "booking" cascade;`);
  }

}
