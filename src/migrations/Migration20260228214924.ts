import { Migration } from '@mikro-orm/migrations';

export class Migration20260228214924 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "refresh_token" ("id" uuid not null default gen_random_uuid(), "user_id" uuid not null, "token_hash" text not null, "expires_at" timestamptz not null, "created_at" timestamptz not null, "revoked_at" timestamptz null, "replaced_by_token" uuid null, "device_info" varchar(255) null, "ip_address" varchar(50) null, constraint "refresh_token_pkey" primary key ("id"));`);
    this.addSql(`create index "idx_refresh_user" on "refresh_token" ("user_id");`);
    this.addSql(`alter table "refresh_token" add constraint "refresh_token_token_hash_unique" unique ("token_hash");`);
    this.addSql(`create index "idx_refresh_expires" on "refresh_token" ("expires_at");`);

    this.addSql(`alter table "refresh_token" add constraint "refresh_token_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table "user" drop column "password", drop column "refresh_token", drop column "refresh_token_expires_at";`);

    this.addSql(`alter table "user" add column "name" varchar(150) not null, add column "phone" varchar(30) null, add column "password_hash" text not null, add column "role" text check ("role" in ('USER', 'ADMIN')) not null default 'USER', add column "is_active" boolean not null default true;`);
    this.addSql(`alter table "user" alter column "email" type varchar(150) using ("email"::varchar(150));`);
    this.addSql(`create index "idx_users_role" on "user" ("role");`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "refresh_token" cascade;`);

    this.addSql(`drop index "idx_users_role";`);
    this.addSql(`alter table "user" drop column "name", drop column "phone", drop column "password_hash", drop column "role", drop column "is_active";`);

    this.addSql(`alter table "user" add column "password" varchar(255) not null, add column "refresh_token" varchar(255) null, add column "refresh_token_expires_at" timestamptz null;`);
    this.addSql(`alter table "user" alter column "email" type varchar(255) using ("email"::varchar(255));`);
  }

}
