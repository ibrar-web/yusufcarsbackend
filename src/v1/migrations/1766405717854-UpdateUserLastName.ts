import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateUserLastName1766405717854 implements MigrationInterface {
    name = 'UpdateUserLastName1766405717854'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "quote_request_service_items" DROP CONSTRAINT "FK_58b282d496c97a5db8855d3a00d"`);
        await queryRunner.query(`ALTER TABLE "quote_request_service_items" DROP CONSTRAINT "FK_f2c0ba5f70725f7a8c16f68a7f2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_service_subcategories_name"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_service_subcategories_slug"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_service_items_name"`);
        await queryRunner.query(`ALTER TABLE "inquiries" RENAME COLUMN "fullName" TO "firstName"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "fullName"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "firstName" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD "lastName" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "service_subcategories" DROP CONSTRAINT "FK_ba9a799fe8faca8d6710b3549d0"`);
        await queryRunner.query(`ALTER TABLE "service_subcategories" ALTER COLUMN "categoryId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "service_items" DROP CONSTRAINT "FK_4ee0ae3d3f388d96e81d1974f39"`);
        await queryRunner.query(`ALTER TABLE "service_items" DROP COLUMN "metadata"`);
        await queryRunner.query(`ALTER TABLE "service_items" ADD "metadata" json`);
        await queryRunner.query(`ALTER TABLE "service_items" ALTER COLUMN "subcategoryId" DROP NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_7ef2e28b495d09a4eb28997c65" ON "service_categories" ("name") `);
        await queryRunner.query(`CREATE INDEX "IDX_88a33271b3d94a0c4bc14db3b7" ON "service_categories" ("slug") `);
        await queryRunner.query(`CREATE INDEX "IDX_59c25d25e10bd01271a5510755" ON "service_subcategories" ("name") `);
        await queryRunner.query(`CREATE INDEX "IDX_3ac4cc1550b373959829685f67" ON "service_subcategories" ("slug") `);
        await queryRunner.query(`CREATE INDEX "IDX_aee954af2fc59ae659d3c4c34d" ON "service_items" ("name") `);
        await queryRunner.query(`CREATE INDEX "IDX_3948a26869da4755ef82ebf6c6" ON "service_items" ("slug") `);
        await queryRunner.query(`CREATE INDEX "IDX_f2c0ba5f70725f7a8c16f68a7f" ON "quote_request_service_items" ("quote_request_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_58b282d496c97a5db8855d3a00" ON "quote_request_service_items" ("service_item_id") `);
        await queryRunner.query(`ALTER TABLE "service_subcategories" ADD CONSTRAINT "FK_ba9a799fe8faca8d6710b3549d0" FOREIGN KEY ("categoryId") REFERENCES "service_categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "service_items" ADD CONSTRAINT "FK_4ee0ae3d3f388d96e81d1974f39" FOREIGN KEY ("subcategoryId") REFERENCES "service_subcategories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "quote_request_service_items" ADD CONSTRAINT "FK_f2c0ba5f70725f7a8c16f68a7f2" FOREIGN KEY ("quote_request_id") REFERENCES "quote_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "quote_request_service_items" ADD CONSTRAINT "FK_58b282d496c97a5db8855d3a00d" FOREIGN KEY ("service_item_id") REFERENCES "service_items"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "quote_request_service_items" DROP CONSTRAINT "FK_58b282d496c97a5db8855d3a00d"`);
        await queryRunner.query(`ALTER TABLE "quote_request_service_items" DROP CONSTRAINT "FK_f2c0ba5f70725f7a8c16f68a7f2"`);
        await queryRunner.query(`ALTER TABLE "service_items" DROP CONSTRAINT "FK_4ee0ae3d3f388d96e81d1974f39"`);
        await queryRunner.query(`ALTER TABLE "service_subcategories" DROP CONSTRAINT "FK_ba9a799fe8faca8d6710b3549d0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_58b282d496c97a5db8855d3a00"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f2c0ba5f70725f7a8c16f68a7f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3948a26869da4755ef82ebf6c6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_aee954af2fc59ae659d3c4c34d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3ac4cc1550b373959829685f67"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_59c25d25e10bd01271a5510755"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_88a33271b3d94a0c4bc14db3b7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7ef2e28b495d09a4eb28997c65"`);
        await queryRunner.query(`ALTER TABLE "service_items" ALTER COLUMN "subcategoryId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "service_items" DROP COLUMN "metadata"`);
        await queryRunner.query(`ALTER TABLE "service_items" ADD "metadata" jsonb`);
        await queryRunner.query(`ALTER TABLE "service_items" ADD CONSTRAINT "FK_4ee0ae3d3f388d96e81d1974f39" FOREIGN KEY ("subcategoryId") REFERENCES "service_subcategories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "service_subcategories" ALTER COLUMN "categoryId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "service_subcategories" ADD CONSTRAINT "FK_ba9a799fe8faca8d6710b3549d0" FOREIGN KEY ("categoryId") REFERENCES "service_categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "lastName"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "firstName"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "fullName" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "inquiries" RENAME COLUMN "firstName" TO "fullName"`);
        await queryRunner.query(`CREATE INDEX "IDX_service_items_name" ON "service_items" ("name") `);
        await queryRunner.query(`CREATE INDEX "IDX_service_subcategories_slug" ON "service_subcategories" ("slug") `);
        await queryRunner.query(`CREATE INDEX "IDX_service_subcategories_name" ON "service_subcategories" ("name") `);
        await queryRunner.query(`ALTER TABLE "quote_request_service_items" ADD CONSTRAINT "FK_f2c0ba5f70725f7a8c16f68a7f2" FOREIGN KEY ("quote_request_id") REFERENCES "quote_requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "quote_request_service_items" ADD CONSTRAINT "FK_58b282d496c97a5db8855d3a00d" FOREIGN KEY ("service_item_id") REFERENCES "service_items"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
