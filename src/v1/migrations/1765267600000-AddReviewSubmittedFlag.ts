import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReviewSubmittedFlag1765267600000 implements MigrationInterface {
  name = 'AddReviewSubmittedFlag1765267600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "reviewSubmitted" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" DROP COLUMN "reviewSubmitted"`,
    );
  }
}
