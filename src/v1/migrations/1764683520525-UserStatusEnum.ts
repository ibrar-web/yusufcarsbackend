import { MigrationInterface, QueryRunner } from "typeorm";

export class UserStatusEnum1764683520525 implements MigrationInterface {
    name = 'UserStatusEnum1764683520525'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_status_enum" AS ENUM('active', 'inactive', 'suspended', 'deleted')`);
        await queryRunner.query(`ALTER TABLE "users" ADD "status" "public"."users_status_enum" NOT NULL DEFAULT 'active'`);
        await queryRunner.query(
            `UPDATE "users" SET "status" = CASE WHEN "isActive" = true THEN 'active'::users_status_enum ELSE 'inactive'::users_status_enum END`,
        );
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "isActive"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "isActive" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`UPDATE "users" SET "isActive" = CASE WHEN "status" = 'active' THEN true ELSE false END`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
    }

}
