import { MigrationInterface, QueryRunner } from "typeorm";

export class Supplierupdated1766482110475 implements MigrationInterface {
    name = 'Supplierupdated1766482110475'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "lastName" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "lastName" DROP NOT NULL`);
    }

}
