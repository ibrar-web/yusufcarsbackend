import { MigrationInterface, QueryRunner } from "typeorm";

export class AddReviewsAndReports1765266254571 implements MigrationInterface {
    name = 'AddReviewsAndReports1765266254571'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "reviews_ratings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "rating" integer NOT NULL DEFAULT '0', "comment" text, "isFlagged" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid NOT NULL, "supplierId" uuid NOT NULL, "orderId" uuid, CONSTRAINT "PK_f133329e988d1319202547e35a8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_8cac6c34b1a64e2b79a093c20f" ON "reviews_ratings" ("orderId", "userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_c9c2fcdbbc4e8e82cdfe7ab040" ON "reviews_ratings" ("rating") `);
        await queryRunner.query(`CREATE TYPE "public"."reports_subject_enum" AS ENUM('user', 'supplier', 'quote_request', 'quote_offer', 'order', 'other')`);
        await queryRunner.query(`CREATE TYPE "public"."reports_status_enum" AS ENUM('open', 'in_review', 'resolved', 'rejected')`);
        await queryRunner.query(`CREATE TABLE "reports" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "subject" "public"."reports_subject_enum" NOT NULL DEFAULT 'other', "subjectId" uuid, "description" text NOT NULL, "status" "public"."reports_status_enum" NOT NULL DEFAULT 'open', "resolutionNotes" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "reporterId" uuid, "assignedAdminId" uuid, CONSTRAINT "PK_d9013193989303580053c0b5ef6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d6b03ee0c4629f5b2b722f3189" ON "reports" ("subject") `);
        await queryRunner.query(`CREATE INDEX "IDX_dab4d78b3be05c1ca4a626f57f" ON "reports" ("status") `);
        await queryRunner.query(`ALTER TYPE "public"."quote_requests_status_enum" RENAME TO "quote_requests_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."quote_requests_status_enum" AS ENUM('pending', 'expired', 'accepted')`);
        await queryRunner.query(`ALTER TABLE "quote_requests" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "quote_requests" ALTER COLUMN "status" TYPE "public"."quote_requests_status_enum" USING "status"::"text"::"public"."quote_requests_status_enum"`);
        await queryRunner.query(`ALTER TABLE "quote_requests" ALTER COLUMN "status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."quote_requests_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "reviews_ratings" ADD CONSTRAINT "FK_97e140b6344b9cb160085adc822" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reviews_ratings" ADD CONSTRAINT "FK_78a457a13b34c7e90b3877e9540" FOREIGN KEY ("supplierId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reviews_ratings" ADD CONSTRAINT "FK_b5942df2b0655f57122abc0f6b1" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reports" ADD CONSTRAINT "FK_4353be8309ce86650def2f8572d" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reports" ADD CONSTRAINT "FK_0571d3b9ed020680a430ad36ae3" FOREIGN KEY ("assignedAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reports" DROP CONSTRAINT "FK_0571d3b9ed020680a430ad36ae3"`);
        await queryRunner.query(`ALTER TABLE "reports" DROP CONSTRAINT "FK_4353be8309ce86650def2f8572d"`);
        await queryRunner.query(`ALTER TABLE "reviews_ratings" DROP CONSTRAINT "FK_b5942df2b0655f57122abc0f6b1"`);
        await queryRunner.query(`ALTER TABLE "reviews_ratings" DROP CONSTRAINT "FK_78a457a13b34c7e90b3877e9540"`);
        await queryRunner.query(`ALTER TABLE "reviews_ratings" DROP CONSTRAINT "FK_97e140b6344b9cb160085adc822"`);
        await queryRunner.query(`CREATE TYPE "public"."quote_requests_status_enum_old" AS ENUM('pending', 'expired', 'quoted', 'accepted', 'converted')`);
        await queryRunner.query(`ALTER TABLE "quote_requests" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "quote_requests" ALTER COLUMN "status" TYPE "public"."quote_requests_status_enum_old" USING "status"::"text"::"public"."quote_requests_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "quote_requests" ALTER COLUMN "status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."quote_requests_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."quote_requests_status_enum_old" RENAME TO "quote_requests_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dab4d78b3be05c1ca4a626f57f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d6b03ee0c4629f5b2b722f3189"`);
        await queryRunner.query(`DROP TABLE "reports"`);
        await queryRunner.query(`DROP TYPE "public"."reports_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."reports_subject_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c9c2fcdbbc4e8e82cdfe7ab040"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8cac6c34b1a64e2b79a093c20f"`);
        await queryRunner.query(`DROP TABLE "reviews_ratings"`);
    }

}
