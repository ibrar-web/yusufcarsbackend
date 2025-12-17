import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class QuoteRequestServiceItems1766007000000
  implements MigrationInterface
{
  private readonly quoteFk = new TableForeignKey({
    columnNames: ['quote_request_id'],
    referencedTableName: 'quote_requests',
    referencedColumnNames: ['id'],
    onDelete: 'CASCADE',
  });

  private readonly itemFk = new TableForeignKey({
    columnNames: ['service_item_id'],
    referencedTableName: 'service_items',
    referencedColumnNames: ['id'],
    onDelete: 'CASCADE',
  });

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'quote_request_service_items',
        columns: [
          {
            name: 'quote_request_id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'service_item_id',
            type: 'uuid',
            isPrimary: true,
          },
        ],
      }),
    );
    await queryRunner.createForeignKey(
      'quote_request_service_items',
      this.quoteFk,
    );
    await queryRunner.createForeignKey(
      'quote_request_service_items',
      this.itemFk,
    );

    await queryRunner.query(`
      INSERT INTO "quote_request_service_items" ("quote_request_id", "service_item_id")
      SELECT qr.id, si.id
      FROM "quote_requests" qr
      CROSS JOIN LATERAL unnest(string_to_array(qr.services, ',')) AS service_id(id_text)
      JOIN "service_items" si ON si.id::text = service_id.id_text
      WHERE qr.services IS NOT NULL AND qr.services <> '';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey(
      'quote_request_service_items',
      this.itemFk,
    );
    await queryRunner.dropForeignKey(
      'quote_request_service_items',
      this.quoteFk,
    );
    await queryRunner.dropTable('quote_request_service_items');
  }
}
