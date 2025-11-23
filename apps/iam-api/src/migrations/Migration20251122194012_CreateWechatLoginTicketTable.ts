import { Migration } from '@mikro-orm/migrations';

export class Migration20251122194012_CreateWechatLoginTicketTable extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table "wechat_login_ticket" ("id" uuid not null default gen_random_uuid(), "created_at" timestamptz not null default CURRENT_TIMESTAMP, "updated_at" timestamptz not null default CURRENT_TIMESTAMP, "ticket" varchar(255) not null, "code" varchar(255) null, "openid" varchar(255) null, "user_info" jsonb null, "status" varchar(255) not null default 'pending', "error" text null, "tokens" jsonb null, "expires_at" timestamptz not null, "user_id" uuid null, constraint "wechat_login_ticket_pkey" primary key ("id"));`,
    );
    this.addSql(
      `alter table "wechat_login_ticket" add constraint "wechat_login_ticket_ticket_unique" unique ("ticket");`,
    );
    this.addSql(
      `alter table "wechat_login_ticket" add constraint "wechat_login_ticket_openid_unique" unique ("openid");`,
    );

    this.addSql(
      `alter table "wechat_login_ticket" add constraint "wechat_login_ticket_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade on delete set null;`,
    );

    this.addSql(
      `alter table "user" add column "wechat_openid" varchar(255) null;`,
    );
    this.addSql(
      `alter table "user" add constraint "user_wechat_openid_unique" unique ("wechat_openid");`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "wechat_login_ticket" cascade;`);

    this.addSql(
      `alter table "user" drop constraint "user_wechat_openid_unique";`,
    );
    this.addSql(`alter table "user" drop column "wechat_openid";`);
  }
}
