import { MigrationInterface, QueryRunner } from 'typeorm';

export class PromotionsAndBadges1768000000000 implements MigrationInterface {
  name = 'PromotionsAndBadges1768000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."supplier_promotions_status_enum" AS ENUM('draft','scheduled','active','expired')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."supplier_promotions_discounttype_enum" AS ENUM('flat','percentage')`,
    );
    await queryRunner.query(`
      CREATE TABLE "supplier_promotions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying(150) NOT NULL,
        "description" text,
        "discountType" "public"."supplier_promotions_discounttype_enum" NOT NULL DEFAULT 'flat',
        "discountValue" numeric NOT NULL,
        "startsAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "endsAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "status" "public"."supplier_promotions_status_enum" NOT NULL DEFAULT 'draft',
        "metadata" json,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "supplierId" uuid NOT NULL,
        "targetCategoryId" uuid,
        "targetItemId" uuid,
        CONSTRAINT "PK_e75eefb4ce5c58a64b9d08a3fa7" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_5f03429adc633a169713cb53dd" ON "supplier_promotions" ("supplierId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9f5a9948df97d21d8588d69cbe" ON "supplier_promotions" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b17ab9f7f90bfcecdcb939f2c4" ON "supplier_promotions" ("endsAt")`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."user_badges_badge_enum" AS ENUM('fast_responder','top_rated','power_seller','customer_favorite','loyal_buyer','community_helper')`,
    );
    await queryRunner.query(`
      CREATE TABLE "user_badges" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "badge" "public"."user_badges_badge_enum" NOT NULL,
        "metadata" json,
        "expiresAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "userId" uuid NOT NULL,
        CONSTRAINT "PK_b5f1566aecf0a3f6cefb5a1bd0f" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_a65c7e94cfa43a2cc0cc222c1e" ON "user_badges" ("userId","badge")`,
    );

    await queryRunner.query(
      `ALTER TABLE "quotes_offers" ADD "promotionSnapshot" json`,
    );
    await queryRunner.query(
      `ALTER TABLE "quotes_offers" ADD "promotionId" uuid`,
    );

    await queryRunner.query(
      `ALTER TABLE "supplier_promotions" ADD CONSTRAINT "FK_e3c86420f46513cdaecd9c823d1" FOREIGN KEY ("supplierId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "supplier_promotions" ADD CONSTRAINT "FK_084a33cca607d1bc105b9566d25" FOREIGN KEY ("targetCategoryId") REFERENCES "service_categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "supplier_promotions" ADD CONSTRAINT "FK_db7e1c446cbda6036587c6b578e" FOREIGN KEY ("targetItemId") REFERENCES "service_items"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_badges" ADD CONSTRAINT "FK_b8e5f142b1873d95ba28e5c5605" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quotes_offers" ADD CONSTRAINT "FK_7ae768eb2a76070e230a504dfad" FOREIGN KEY ("promotionId") REFERENCES "supplier_promotions"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "quotes_offers" DROP CONSTRAINT "FK_7ae768eb2a76070e230a504dfad"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_badges" DROP CONSTRAINT "FK_b8e5f142b1873d95ba28e5c5605"`,
    );
    await queryRunner.query(
      `ALTER TABLE "supplier_promotions" DROP CONSTRAINT "FK_db7e1c446cbda6036587c6b578e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "supplier_promotions" DROP CONSTRAINT "FK_084a33cca607d1bc105b9566d25"`,
    );
    await queryRunner.query(
      `ALTER TABLE "supplier_promotions" DROP CONSTRAINT "FK_e3c86420f46513cdaecd9c823d1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quotes_offers" DROP COLUMN "promotionId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quotes_offers" DROP COLUMN "promotionSnapshot"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a65c7e94cfa43a2cc0cc222c1e"`,
    );
    await queryRunner.query(`DROP TABLE "user_badges"`);
    await queryRunner.query(`DROP TYPE "public"."user_badges_badge_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b17ab9f7f90bfcecdcb939f2c4"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9f5a9948df97d21d8588d69cbe"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5f03429adc633a169713cb53dd"`,
    );
    await queryRunner.query(`DROP TABLE "supplier_promotions"`);
    await queryRunner.query(
      `DROP TYPE "public"."supplier_promotions_discounttype_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."supplier_promotions_status_enum"`,
    );
  }
}
