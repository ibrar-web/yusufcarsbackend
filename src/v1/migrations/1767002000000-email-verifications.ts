import { MigrationInterface, QueryRunner } from 'typeorm';

export class EmailVerifications1767002000000 implements MigrationInterface {
  name = 'EmailVerifications1767002000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "emailVerifiedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `CREATE TABLE "email_verifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" character varying(6) NOT NULL,
        "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "attempts" integer NOT NULL DEFAULT 0,
        "consumed" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "verifiedAt" TIMESTAMP WITH TIME ZONE,
        "userId" uuid,
        CONSTRAINT "PK_8cc323a7ed61183362036b49db4" PRIMARY KEY ("id")
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3dff00799f63e0a29010a82fbe" ON "email_verifications" ("userId", "code")`,
    );
    await queryRunner.query(
      `ALTER TABLE "email_verifications"
        ADD CONSTRAINT "FK_b67a632a83ad1c5b1af72a5d45d"
        FOREIGN KEY ("userId") REFERENCES "users"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "email_verifications" DROP CONSTRAINT "FK_b67a632a83ad1c5b1af72a5d45d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3dff00799f63e0a29010a82fbe"`,
    );
    await queryRunner.query(`DROP TABLE "email_verifications"`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "emailVerifiedAt"`,
    );
  }
}
