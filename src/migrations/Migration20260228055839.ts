import { Migration } from '@mikro-orm/migrations';

export class Migration20260228055839 extends Migration {
  override up(): void {
    this.addSql(
      `alter table "event" add column "created_at" timestamptz not null, add column "updated_at" timestamptz not null;`,
    );

    this.addSql(
      `alter table "seat_tier" add column "created_at" timestamptz not null, add column "updated_at" timestamptz not null;`,
    );

    this.addSql(
      `alter table "seat" add column "created_at" timestamptz not null, add column "updated_at" timestamptz not null;`,
    );

    this.addSql(
      `alter table "user" add column "created_at" timestamptz not null, add column "updated_at" timestamptz not null;`,
    );

    this.addSql(
      `alter table "booking" add column "updated_at" timestamptz not null;`,
    );
  }

  override down(): void {
    this.addSql(
      `alter table "event" drop column "created_at", drop column "updated_at";`,
    );

    this.addSql(
      `alter table "seat_tier" drop column "created_at", drop column "updated_at";`,
    );

    this.addSql(
      `alter table "seat" drop column "created_at", drop column "updated_at";`,
    );

    this.addSql(
      `alter table "user" drop column "created_at", drop column "updated_at";`,
    );

    this.addSql(`alter table "booking" drop column "updated_at";`);
  }
}
