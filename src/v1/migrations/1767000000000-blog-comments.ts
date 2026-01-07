import { MigrationInterface, QueryRunner } from 'typeorm';

export class BlogComments1767000000000 implements MigrationInterface {
  name = 'BlogComments1767000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "blogs" DROP CONSTRAINT "FK_23894b0eefebe5cb62c38484fdc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs" DROP CONSTRAINT "FK_df0ace761552cf45be9a3724dc4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs" RENAME COLUMN "author_admin_id" TO "publisher_id"`,
    );
    await queryRunner.query(
      `UPDATE "blogs"
         SET "publisher_id" = suppliers.user_id
       FROM suppliers
       WHERE "blogs"."author_supplier_id" = suppliers.id
         AND suppliers.user_id IS NOT NULL
         AND "blogs"."publisher_id" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs" DROP COLUMN "author_supplier_id"`,
    );
    await queryRunner.query(`ALTER TABLE "blogs" ADD "comments" text array`);
    await queryRunner.query(
      `ALTER TABLE "blogs" ADD CONSTRAINT "FK_a5c560d8e880fc7c83e4f75a022" FOREIGN KEY ("publisher_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "blogs" DROP CONSTRAINT "FK_a5c560d8e880fc7c83e4f75a022"`,
    );
    await queryRunner.query(`ALTER TABLE "blogs" DROP COLUMN "comments"`);
    await queryRunner.query(
      `ALTER TABLE "blogs" ADD "author_supplier_id" uuid`,
    );
    await queryRunner.query(`ALTER TABLE "blogs" ADD "author_admin_id" uuid`);
    await queryRunner.query(
      `UPDATE "blogs" SET "author_admin_id" = "publisher_id"`,
    );
    await queryRunner.query(
      `UPDATE "blogs"
         SET "author_supplier_id" = suppliers.id
       FROM suppliers
       WHERE "blogs"."publisher_id" = suppliers.user_id`,
    );
    await queryRunner.query(`ALTER TABLE "blogs" DROP COLUMN "publisher_id"`);
    await queryRunner.query(
      `ALTER TABLE "blogs" ADD CONSTRAINT "FK_df0ace761552cf45be9a3724dc4" FOREIGN KEY ("author_admin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs" ADD CONSTRAINT "FK_23894b0eefebe5cb62c38484fdc" FOREIGN KEY ("author_supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }
}
