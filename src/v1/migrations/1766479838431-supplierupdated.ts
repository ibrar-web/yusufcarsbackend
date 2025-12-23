import { MigrationInterface, QueryRunner } from "typeorm";

export class Supplierupdated1766479838431 implements MigrationInterface {
    name = 'Supplierupdated1766479838431'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_7e79d280d92d8b9ce60089de5d"`);
        await queryRunner.query(`ALTER TABLE "suppliers" DROP COLUMN "contactPostcode"`);
        await queryRunner.query(`ALTER TABLE "suppliers" DROP COLUMN "categories"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "suppliers" ADD "categories" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "suppliers" ADD "contactPostcode" character varying NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_7e79d280d92d8b9ce60089de5d" ON "suppliers" ("categories") `);
    }

}
