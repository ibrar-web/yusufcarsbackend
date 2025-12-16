import { MigrationInterface, QueryRunner } from 'typeorm';

export class SupplierUsesUser1764680865039 implements MigrationInterface {
  name = 'SupplierUsesUser1764680865039';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "quotes_offers" DROP CONSTRAINT "FK_c7bbc8f3fa0142df4e887db6935"`,
    );
    await queryRunner.query(
      `ALTER TABLE "supplier_quote_notifications" DROP CONSTRAINT "FK_4256e4d87656c127808f958d19d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_37217f20f8c8b431ae720dd210e"`,
    );
    await queryRunner.query(`
            UPDATE "quotes_offers" qo
            SET "supplierId" = s."user_id"
            FROM "suppliers" s
            WHERE qo."supplierId" = s."id"
        `);
    await queryRunner.query(`
            UPDATE "supplier_quote_notifications" sqn
            SET "supplierId" = s."user_id"
            FROM "suppliers" s
            WHERE sqn."supplierId" = s."id"
        `);
    await queryRunner.query(`
            UPDATE "orders" o
            SET "supplierId" = s."user_id"
            FROM "suppliers" s
            WHERE o."supplierId" = s."id"
        `);
    await queryRunner.query(
      `ALTER TABLE "quotes_offers" ADD CONSTRAINT "FK_c7bbc8f3fa0142df4e887db6935" FOREIGN KEY ("supplierId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "supplier_quote_notifications" ADD CONSTRAINT "FK_4256e4d87656c127808f958d19d" FOREIGN KEY ("supplierId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_37217f20f8c8b431ae720dd210e" FOREIGN KEY ("supplierId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_37217f20f8c8b431ae720dd210e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "supplier_quote_notifications" DROP CONSTRAINT "FK_4256e4d87656c127808f958d19d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quotes_offers" DROP CONSTRAINT "FK_c7bbc8f3fa0142df4e887db6935"`,
    );
    await queryRunner.query(`
            UPDATE "quotes_offers" qo
            SET "supplierId" = s."id"
            FROM "suppliers" s
            WHERE qo."supplierId" = s."user_id"
        `);
    await queryRunner.query(`
            UPDATE "supplier_quote_notifications" sqn
            SET "supplierId" = s."id"
            FROM "suppliers" s
            WHERE sqn."supplierId" = s."user_id"
        `);
    await queryRunner.query(`
            UPDATE "orders" o
            SET "supplierId" = s."id"
            FROM "suppliers" s
            WHERE o."supplierId" = s."user_id"
        `);
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_37217f20f8c8b431ae720dd210e" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "supplier_quote_notifications" ADD CONSTRAINT "FK_4256e4d87656c127808f958d19d" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quotes_offers" ADD CONSTRAINT "FK_c7bbc8f3fa0142df4e887db6935" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
