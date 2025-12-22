import { MigrationInterface, QueryRunner } from 'typeorm';

export class Initial1766407891809 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "firstName" character varying NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "lastName" character varying`,
    );
    await queryRunner.query(`
      UPDATE "users"
      SET "firstName" = CASE
            WHEN coalesce(btrim("fullName"), '') = '' THEN 'User'
            ELSE split_part(btrim("fullName"), ' ', 1)
          END,
          "lastName" = NULLIF(
            btrim(
              CASE
                WHEN position(' ' in btrim(coalesce("fullName", ''))) > 0 THEN
                  substring(btrim("fullName") from position(' ' in btrim("fullName")) + 1)
                ELSE ''
              END
            ),
            ''
          )
    `);
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "firstName" DROP DEFAULT`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "fullName"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "fullName" character varying NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(`
      UPDATE "users"
      SET "fullName" = btrim(
        concat_ws(' ', coalesce("firstName", ''), coalesce("lastName", ''))
      )
    `);
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "fullName" DROP DEFAULT`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "lastName"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "firstName"`);
  }
}
