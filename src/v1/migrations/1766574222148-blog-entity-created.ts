import { MigrationInterface, QueryRunner } from 'typeorm';

export class BlogEntityCreated1766574222148 implements MigrationInterface {
  name = 'BlogEntityCreated1766574222148';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "tags" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_d90243459a697eadb8ad56e9092" UNIQUE ("name"), CONSTRAINT "PK_e7dc17249a1148a1970748eda99" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "blogs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(200) NOT NULL, "content" text NOT NULL, "categories" text array, "images" text array, "videoUrl" character varying(500), "references" text array, "seoTitle" character varying(200), "seoDescription" character varying(300), "seoImageUrl" character varying(500), "isPublished" boolean NOT NULL DEFAULT true, "publishAt" TIMESTAMP WITH TIME ZONE, "isFeatured" boolean NOT NULL DEFAULT false, "views" integer NOT NULL DEFAULT '0', "likes" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "author_admin_id" uuid, "author_supplier_id" uuid, CONSTRAINT "PK_e113335f11c926da929a625f118" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "blog_tags" ("blog_id" uuid NOT NULL, "tag_id" uuid NOT NULL, CONSTRAINT "PK_561e9296a2ba753a9900831104c" PRIMARY KEY ("blog_id", "tag_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_20ce3565a4dda1ce7a3e8104f2" ON "blog_tags" ("blog_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7d8cc813269fa2a0ec3f857187" ON "blog_tags" ("tag_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs" ADD CONSTRAINT "FK_df0ace761552cf45be9a3724dc4" FOREIGN KEY ("author_admin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs" ADD CONSTRAINT "FK_23894b0eefebe5cb62c38484fdc" FOREIGN KEY ("author_supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "blog_tags" ADD CONSTRAINT "FK_20ce3565a4dda1ce7a3e8104f2a" FOREIGN KEY ("blog_id") REFERENCES "blogs"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "blog_tags" ADD CONSTRAINT "FK_7d8cc813269fa2a0ec3f8571876" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "blog_tags" DROP CONSTRAINT "FK_7d8cc813269fa2a0ec3f8571876"`,
    );
    await queryRunner.query(
      `ALTER TABLE "blog_tags" DROP CONSTRAINT "FK_20ce3565a4dda1ce7a3e8104f2a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs" DROP CONSTRAINT "FK_23894b0eefebe5cb62c38484fdc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs" DROP CONSTRAINT "FK_df0ace761552cf45be9a3724dc4"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7d8cc813269fa2a0ec3f857187"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_20ce3565a4dda1ce7a3e8104f2"`,
    );
    await queryRunner.query(`DROP TABLE "blog_tags"`);
    await queryRunner.query(`DROP TABLE "blogs"`);
    await queryRunner.query(`DROP TABLE "tags"`);
  }
}
