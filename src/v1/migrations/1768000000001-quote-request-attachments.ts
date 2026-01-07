import { MigrationInterface, QueryRunner } from 'typeorm';

export class QuoteRequestAttachments1768000000001
  implements MigrationInterface
{
  name = 'QuoteRequestAttachments1768000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "quote_requests" ADD "attachments" json`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "quote_requests" DROP COLUMN "attachments"`,
    );
  }
}
