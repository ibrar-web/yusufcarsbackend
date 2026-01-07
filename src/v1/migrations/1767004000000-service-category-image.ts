import { MigrationInterface, QueryRunner } from 'typeorm';

export class ServiceCategoryImage1767004000000 implements MigrationInterface {
  name = 'ServiceCategoryImage1767004000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "service_categories" ADD "imageKey" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_categories" ADD "imageUrl" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "service_categories" DROP COLUMN "imageUrl"`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_categories" DROP COLUMN "imageKey"`,
    );
  }
}
