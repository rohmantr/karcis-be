import { Migration } from '@mikro-orm/migrations';

export class Migration20260301124642 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "event" add column "artist_name" varchar(255) not null, add column "description" text not null, add column "genre" varchar(100) not null, add column "city" varchar(100) not null, add column "venue" varchar(255) not null, add column "address" text not null, add column "event_date" timestamptz not null, add column "poster_url" text null, add column "status" text check ("status" in ('DRAFT', 'PUBLISHED', 'SOLD_OUT', 'CANCELLED')) not null default 'DRAFT', add column "created_by_id" uuid not null;`);
    this.addSql(`alter table "event" add constraint "event_created_by_id_foreign" foreign key ("created_by_id") references "user" ("id") on update cascade;`);
    this.addSql(`create index "idx_event_city" on "event" ("city");`);
    this.addSql(`create index "idx_event_date" on "event" ("event_date");`);
    this.addSql(`create index "idx_event_status" on "event" ("status");`);
    this.addSql(`create index "idx_event_created_by" on "event" ("created_by_id");`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "event" drop constraint "event_created_by_id_foreign";`);

    this.addSql(`drop index "idx_event_city";`);
    this.addSql(`drop index "idx_event_date";`);
    this.addSql(`drop index "idx_event_status";`);
    this.addSql(`drop index "idx_event_created_by";`);
    this.addSql(`alter table "event" drop column "artist_name", drop column "description", drop column "genre", drop column "city", drop column "venue", drop column "address", drop column "event_date", drop column "poster_url", drop column "status", drop column "created_by_id";`);
  }

}
