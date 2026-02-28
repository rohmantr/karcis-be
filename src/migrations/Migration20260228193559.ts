import { Migration } from '@mikro-orm/migrations';

export class Migration20260228193559 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "user" add column "password" varchar(255) not null, add column "refresh_token" varchar(255) null, add column "refresh_token_expires_at" timestamptz null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "user" drop column "password", drop column "refresh_token", drop column "refresh_token_expires_at";`);
  }

}
