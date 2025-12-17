import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class AddServiceTaxonomy1766000000000 implements MigrationInterface {
  private readonly subcategoryFk = new TableForeignKey({
    columnNames: ['categoryId'],
    referencedTableName: 'service_categories',
    referencedColumnNames: ['id'],
    onDelete: 'CASCADE',
  });

  private readonly itemFk = new TableForeignKey({
    columnNames: ['subcategoryId'],
    referencedTableName: 'service_subcategories',
    referencedColumnNames: ['id'],
    onDelete: 'CASCADE',
  });

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'service_categories',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'name', type: 'varchar', isUnique: true },
          { name: 'slug', type: 'varchar', isUnique: true },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'sortOrder', type: 'int', default: 0 },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'service_subcategories',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'categoryId',
            type: 'uuid',
          },
          { name: 'name', type: 'varchar' },
          { name: 'slug', type: 'varchar' },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'sortOrder', type: 'int', default: 0 },
        ],
      }),
    );
    await queryRunner.createIndex(
      'service_subcategories',
      new TableIndex({
        name: 'IDX_service_subcategories_name',
        columnNames: ['name'],
      }),
    );
    await queryRunner.createIndex(
      'service_subcategories',
      new TableIndex({
        name: 'IDX_service_subcategories_slug',
        columnNames: ['slug'],
      }),
    );
    await queryRunner.createForeignKey('service_subcategories', this.subcategoryFk);

    await queryRunner.createTable(
      new Table({
        name: 'service_items',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'subcategoryId', type: 'uuid' },
          { name: 'name', type: 'varchar' },
          { name: 'slug', type: 'varchar', isUnique: true },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'metadata', type: 'jsonb', isNullable: true },
        ],
      }),
    );
    await queryRunner.createIndex(
      'service_items',
      new TableIndex({
        name: 'IDX_service_items_name',
        columnNames: ['name'],
      }),
    );
    await queryRunner.createForeignKey('service_items', this.itemFk);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('service_items', this.itemFk);
    await queryRunner.dropTable('service_items');

    await queryRunner.dropForeignKey('service_subcategories', this.subcategoryFk);
    await queryRunner.dropIndex('service_subcategories', 'IDX_service_subcategories_name');
    await queryRunner.dropIndex('service_subcategories', 'IDX_service_subcategories_slug');
    await queryRunner.dropTable('service_subcategories');

    await queryRunner.dropTable('service_categories');
  }
}
