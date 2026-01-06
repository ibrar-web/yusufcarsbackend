import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProfileEnhancements1767003000000 implements MigrationInterface {
  name = 'ProfileEnhancements1767003000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "phone" character varying(50)`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "profileImageKey" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "profileImageUrl" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "profileCompletion" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "profileCompleted" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "suppliers" ADD "mainCategoryImageKey" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "suppliers" ADD "mainCategoryImageUrl" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "suppliers" DROP COLUMN "mainCategoryImageUrl"`,
    );
    await queryRunner.query(
      `ALTER TABLE "suppliers" DROP COLUMN "mainCategoryImageKey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "profileCompleted"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "profileCompletion"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "profileImageUrl"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "profileImageKey"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "phone"`);
  }
}
