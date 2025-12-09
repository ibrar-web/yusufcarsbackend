import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateOrderStatusEnum1765268200000
  implements MigrationInterface
{
  name = 'UpdateOrderStatusEnum1765268200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `UPDATE "orders" SET "status" = 'in_transit' WHERE "status" = 'pending_delivery'`,
    );
    await queryRunner.query(
      `UPDATE "orders" SET "status" = 'completed' WHERE "status" = 'delivered'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."orders_status_enum" RENAME TO "orders_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."orders_status_enum" AS ENUM('in_transit', 'completed', 'cancelled')`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "status" TYPE "public"."orders_status_enum" USING "status"::text::"public"."orders_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'in_transit'`,
    );
    await queryRunner.query(`DROP TYPE "orders_status_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."orders_status_enum" RENAME TO "orders_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."orders_status_enum" AS ENUM('pending_delivery', 'in_transit', 'delivered', 'completed', 'cancelled')`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "status" TYPE "public"."orders_status_enum" USING "status"::text::"public"."orders_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'pending_delivery'`,
    );
    await queryRunner.query(`DROP TYPE "orders_status_enum_old"`);
  }
}
