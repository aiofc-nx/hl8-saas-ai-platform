import { Migration } from '@mikro-orm/migrations';

export class Migration20251119095011 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "otp" ("id" uuid not null default gen_random_uuid(), "created_at" timestamptz not null default CURRENT_TIMESTAMP, "updated_at" timestamptz not null default CURRENT_TIMESTAMP, "otp" varchar(255) not null, "expires" timestamptz not null, "type" text check ("type" in ('EMAIL_VERIFICATION', 'EMAIL_CONFIRMATION', 'PASSWORD_RESET')) not null, constraint "otp_pkey" primary key ("id"));`);

    this.addSql(`create table "user" ("id" uuid not null default gen_random_uuid(), "created_at" timestamptz not null default CURRENT_TIMESTAMP, "updated_at" timestamptz not null default CURRENT_TIMESTAMP, "email" varchar(255) not null, "password" varchar(255) null, "username" varchar(255) not null, "is_email_verified" boolean null default false, "email_verified_at" timestamptz null, constraint "user_pkey" primary key ("id"));`);
    this.addSql(`alter table "user" add constraint "user_email_unique" unique ("email");`);
    this.addSql(`alter table "user" add constraint "user_username_unique" unique ("username");`);

    this.addSql(`create table "session" ("id" uuid not null default gen_random_uuid(), "created_at" timestamptz not null default CURRENT_TIMESTAMP, "updated_at" timestamptz not null default CURRENT_TIMESTAMP, "ip" varchar(255) null default 'unknown', "location" varchar(255) null default 'unknown', "device_os" varchar(255) null default 'unknown', "device_name" varchar(255) null default 'unknown', "device_type" varchar(255) null default 'unknown', "browser" varchar(255) null default 'unknown', "user_agent" varchar(255) null default 'unknown', "refresh_token" text not null, "user_id" uuid not null, constraint "session_pkey" primary key ("id"));`);

    this.addSql(`create table "profile" ("id" uuid not null default gen_random_uuid(), "created_at" timestamptz not null default CURRENT_TIMESTAMP, "updated_at" timestamptz not null default CURRENT_TIMESTAMP, "user_id" uuid not null, "name" varchar(255) not null, "gender" varchar(255) not null default 'UNKNOWN', "phone_number" varchar(255) null, "profile_picture" varchar(255) null, "date_of_birth" timestamptz null, "address" text null, constraint "profile_pkey" primary key ("id"));`);
    this.addSql(`alter table "profile" add constraint "profile_user_id_unique" unique ("user_id");`);
    this.addSql(`alter table "profile" add constraint "profile_phone_number_unique" unique ("phone_number");`);

    this.addSql(`alter table "session" add constraint "session_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade;`);

    this.addSql(`alter table "profile" add constraint "profile_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "session" drop constraint "session_user_id_foreign";`);

    this.addSql(`alter table "profile" drop constraint "profile_user_id_foreign";`);

    this.addSql(`drop table if exists "otp" cascade;`);

    this.addSql(`drop table if exists "user" cascade;`);

    this.addSql(`drop table if exists "session" cascade;`);

    this.addSql(`drop table if exists "profile" cascade;`);
  }

}
