import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1764675402265 implements MigrationInterface {
  name = 'InitialSchema1764675402265';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "supplier_document_types" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "displayName" character varying(150) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_be1db2669c04cb2e1bcfbbcfc9b" UNIQUE ("name"), CONSTRAINT "PK_e2379c6f0b1b2b0608c71077715" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_be1db2669c04cb2e1bcfbbcfc9" ON "supplier_document_types" ("name") `,
    );
    await queryRunner.query(
      `CREATE TABLE "supplier_documents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "s3Key" character varying(255) NOT NULL, "originalName" character varying(255) NOT NULL, "mimeType" character varying(150), "size" bigint, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "supplier_id" uuid, "document_type_id" uuid, CONSTRAINT "UQ_supplier_document_per_type" UNIQUE ("supplier_id", "document_type_id"), CONSTRAINT "PK_b1df9d525587d1d8341e07dc0b2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."suppliers_approvalstatus_enum" AS ENUM('pending', 'approved', 'rejected', 'needs_more_information')`,
    );
    await queryRunner.query(
      `CREATE TABLE "suppliers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "businessName" character varying NOT NULL, "tradingAs" character varying NOT NULL, "businessType" character varying NOT NULL, "vatNumber" character varying NOT NULL, "description" character varying NOT NULL, "addressLine1" character varying NOT NULL, "addressLine2" character varying, "city" character varying NOT NULL, "postCode" character varying NOT NULL, "country" character varying, "state" character varying, "phone" character varying NOT NULL, "contactPostcode" character varying NOT NULL, "termsAccepted" boolean NOT NULL, "gdprConsent" boolean NOT NULL, "categories" text NOT NULL, "approvalStatus" "public"."suppliers_approvalstatus_enum" NOT NULL DEFAULT 'pending', "rejectionReason" text, "approvedAt" TIMESTAMP WITH TIME ZONE, "submittedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid, CONSTRAINT "REL_b3aba33228acd59f2d734c31b8" UNIQUE ("user_id"), CONSTRAINT "PK_b70ac51766a9e3144f778cfe81e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7e79d280d92d8b9ce60089de5d" ON "suppliers" ("categories") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3e0dceb48c719366b370ba0f14" ON "suppliers" ("postCode") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2be31dceef604539db316f6613" ON "suppliers" ("approvalStatus") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'user', 'supplier', 'garage', 'mechanic', 'dealer')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password" character varying NOT NULL, "fullName" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'user', "isActive" boolean NOT NULL DEFAULT true, "suspensionReason" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "postCode" character varying NOT NULL, "latitude" double precision NOT NULL, "longitude" double precision NOT NULL, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ace513fa30d485cfd25c11a9e4" ON "users" ("role") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c35cee5cd356d46618a4c6e830" ON "users" ("latitude") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_86bdc2660bdb0a455ebc911b24" ON "users" ("longitude") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."quote_requests_requesttype_enum" AS ENUM('local', 'national')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."quote_requests_status_enum" AS ENUM('pending', 'expired', 'quoted', 'accepted', 'converted')`,
    );
    await queryRunner.query(
      `CREATE TABLE "quote_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "registrationNumber" character varying NOT NULL, "postcode" character varying NOT NULL, "vin" character varying, "make" character varying NOT NULL, "model" character varying, "taxStatus" character varying, "taxDueDate" character varying, "motStatus" character varying, "yearOfManufacture" character varying, "fuelType" character varying, "engineSize" character varying, "engineCapacity" integer, "co2Emissions" integer, "requireFitment" boolean NOT NULL DEFAULT false, "markedForExport" boolean NOT NULL DEFAULT false, "colour" character varying, "typeApproval" character varying, "revenueWeight" integer, "dateOfLastV5CIssued" character varying, "motExpiryDate" character varying, "wheelplan" character varying, "monthOfFirstRegistration" character varying, "services" text, "requestType" "public"."quote_requests_requesttype_enum" NOT NULL DEFAULT 'local', "latitude" double precision, "longitude" double precision, "status" "public"."quote_requests_status_enum" NOT NULL DEFAULT 'pending', "expiresAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, CONSTRAINT "PK_c05f72de8be0ec6b0985a851558" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_02b8d0b310c41704154d56125a" ON "quote_requests" ("latitude") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7e52fda3642dfa2d4651f09f75" ON "quote_requests" ("longitude") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c52a84f959c92e61404482f4cd" ON "quote_requests" ("postcode", "requestType") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ec5f45271b59efe435e7819360" ON "quote_requests" ("status") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."quotes_offers_status_enum" AS ENUM('pending', 'accepted', 'expired')`,
    );
    await queryRunner.query(
      `CREATE TABLE "quotes_offers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "partName" character varying NOT NULL, "brand" character varying NOT NULL, "offers" json, "price" numeric NOT NULL, "estimatedTime" character varying NOT NULL, "partCondition" character varying, "notes" text, "expiresAt" TIMESTAMP NOT NULL, "status" "public"."quotes_offers_status_enum" NOT NULL DEFAULT 'pending', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "quoteRequestId" uuid, "supplierId" uuid, CONSTRAINT "PK_619f8b8cf40c8dfca86e3e563fe" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c11b777967bf4f1aa6c7d96431" ON "quotes_offers" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6df4ad409903335109adb51a16" ON "quotes_offers" ("quoteRequestId", "supplierId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "chats" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, "supplierId" uuid, CONSTRAINT "PK_0117647b3c4a4e5ff198aeb6206" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "content" text NOT NULL, "isRead" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "chatId" uuid, "senderId" uuid, CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."inquiries_urgency_enum" AS ENUM('low', 'normal', 'high')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."inquiries_status_enum" AS ENUM('pending', 'expired', 'completed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "inquiries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "fullName" character varying NOT NULL, "email" character varying NOT NULL, "subject" character varying NOT NULL, "urgency" "public"."inquiries_urgency_enum" NOT NULL DEFAULT 'normal', "content" text NOT NULL, "fileName" character varying, "fileKey" character varying, "contact" boolean NOT NULL DEFAULT false, "status" "public"."inquiries_status_enum" NOT NULL DEFAULT 'pending', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ceacaa439988b25eb9459e694d9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."supplier_quote_notifications_status_enum" AS ENUM('pending', 'quoted', 'expired', 'accepted', 'rejected')`,
    );
    await queryRunner.query(
      `CREATE TABLE "supplier_quote_notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "public"."supplier_quote_notifications_status_enum" NOT NULL DEFAULT 'pending', "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "quotedAt" TIMESTAMP WITH TIME ZONE, "rejectionReason" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "supplierId" uuid NOT NULL, "requestId" uuid NOT NULL, CONSTRAINT "PK_b819cf3cafb1944da09c3c6a258" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c99800a45d5d713e00f8fbc231" ON "supplier_quote_notifications" ("expiresAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_61f482f2a00daed149501ffe49" ON "supplier_quote_notifications" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5d7ef23908eadf2dd853190996" ON "supplier_quote_notifications" ("requestId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4256e4d87656c127808f958d19" ON "supplier_quote_notifications" ("supplierId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_9a14e3020f903e44eda228e8a1" ON "supplier_quote_notifications" ("supplierId", "requestId") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."orders_status_enum" AS ENUM('pending_delivery', 'in_transit', 'delivered', 'completed', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "public"."orders_status_enum" NOT NULL DEFAULT 'pending_delivery', "deliveryDate" TIMESTAMP WITH TIME ZONE, "trackingInfo" json, "cancellationReason" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "request_id" uuid NOT NULL, "supplierId" uuid NOT NULL, "accepted_quote_id" uuid NOT NULL, "buyerId" uuid NOT NULL, CONSTRAINT "REL_65e5574e877928bc1415d48ace" UNIQUE ("request_id"), CONSTRAINT "REL_070b69f041b250c74c038aedef" UNIQUE ("accepted_quote_id"), CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_775c9f06fc27ae3ff8fb26f2c4" ON "orders" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9877ffd9a491c3e82f5b32d4f4" ON "orders" ("buyerId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_37217f20f8c8b431ae720dd210" ON "orders" ("supplierId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_65e5574e877928bc1415d48ace" ON "orders" ("request_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "supplier_documents" ADD CONSTRAINT "FK_399a19b7cb4420b5816d6963f7f" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "supplier_documents" ADD CONSTRAINT "FK_a781ef578ca2ce6a20dc4707ec1" FOREIGN KEY ("document_type_id") REFERENCES "supplier_document_types"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "suppliers" ADD CONSTRAINT "FK_b3aba33228acd59f2d734c31b82" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quote_requests" ADD CONSTRAINT "FK_1ea22edc0dff28ac7d12e446f73" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quotes_offers" ADD CONSTRAINT "FK_1b53f65016970932ddce752fcd5" FOREIGN KEY ("quoteRequestId") REFERENCES "quote_requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quotes_offers" ADD CONSTRAINT "FK_c7bbc8f3fa0142df4e887db6935" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chats" ADD CONSTRAINT "FK_ae8951c0a763a060593606b7e2d" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chats" ADD CONSTRAINT "FK_d7cfe721a42704bbed014f7071c" FOREIGN KEY ("supplierId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_36bc604c820bb9adc4c75cd4115" FOREIGN KEY ("chatId") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_2db9cf2b3ca111742793f6c37ce" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "supplier_quote_notifications" ADD CONSTRAINT "FK_4256e4d87656c127808f958d19d" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "supplier_quote_notifications" ADD CONSTRAINT "FK_5d7ef23908eadf2dd853190996a" FOREIGN KEY ("requestId") REFERENCES "quote_requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_65e5574e877928bc1415d48acef" FOREIGN KEY ("request_id") REFERENCES "quote_requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_37217f20f8c8b431ae720dd210e" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_070b69f041b250c74c038aedef2" FOREIGN KEY ("accepted_quote_id") REFERENCES "quotes_offers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_9877ffd9a491c3e82f5b32d4f4d" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_9877ffd9a491c3e82f5b32d4f4d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_070b69f041b250c74c038aedef2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_37217f20f8c8b431ae720dd210e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_65e5574e877928bc1415d48acef"`,
    );
    await queryRunner.query(
      `ALTER TABLE "supplier_quote_notifications" DROP CONSTRAINT "FK_5d7ef23908eadf2dd853190996a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "supplier_quote_notifications" DROP CONSTRAINT "FK_4256e4d87656c127808f958d19d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_2db9cf2b3ca111742793f6c37ce"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_36bc604c820bb9adc4c75cd4115"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chats" DROP CONSTRAINT "FK_d7cfe721a42704bbed014f7071c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chats" DROP CONSTRAINT "FK_ae8951c0a763a060593606b7e2d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quotes_offers" DROP CONSTRAINT "FK_c7bbc8f3fa0142df4e887db6935"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quotes_offers" DROP CONSTRAINT "FK_1b53f65016970932ddce752fcd5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quote_requests" DROP CONSTRAINT "FK_1ea22edc0dff28ac7d12e446f73"`,
    );
    await queryRunner.query(
      `ALTER TABLE "suppliers" DROP CONSTRAINT "FK_b3aba33228acd59f2d734c31b82"`,
    );
    await queryRunner.query(
      `ALTER TABLE "supplier_documents" DROP CONSTRAINT "FK_a781ef578ca2ce6a20dc4707ec1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "supplier_documents" DROP CONSTRAINT "FK_399a19b7cb4420b5816d6963f7f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_65e5574e877928bc1415d48ace"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_37217f20f8c8b431ae720dd210"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9877ffd9a491c3e82f5b32d4f4"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_775c9f06fc27ae3ff8fb26f2c4"`,
    );
    await queryRunner.query(`DROP TABLE "orders"`);
    await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9a14e3020f903e44eda228e8a1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4256e4d87656c127808f958d19"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5d7ef23908eadf2dd853190996"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_61f482f2a00daed149501ffe49"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c99800a45d5d713e00f8fbc231"`,
    );
    await queryRunner.query(`DROP TABLE "supplier_quote_notifications"`);
    await queryRunner.query(
      `DROP TYPE "public"."supplier_quote_notifications_status_enum"`,
    );
    await queryRunner.query(`DROP TABLE "inquiries"`);
    await queryRunner.query(`DROP TYPE "public"."inquiries_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."inquiries_urgency_enum"`);
    await queryRunner.query(`DROP TABLE "messages"`);
    await queryRunner.query(`DROP TABLE "chats"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6df4ad409903335109adb51a16"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c11b777967bf4f1aa6c7d96431"`,
    );
    await queryRunner.query(`DROP TABLE "quotes_offers"`);
    await queryRunner.query(`DROP TYPE "public"."quotes_offers_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ec5f45271b59efe435e7819360"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c52a84f959c92e61404482f4cd"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7e52fda3642dfa2d4651f09f75"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_02b8d0b310c41704154d56125a"`,
    );
    await queryRunner.query(`DROP TABLE "quote_requests"`);
    await queryRunner.query(`DROP TYPE "public"."quote_requests_status_enum"`);
    await queryRunner.query(
      `DROP TYPE "public"."quote_requests_requesttype_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_86bdc2660bdb0a455ebc911b24"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c35cee5cd356d46618a4c6e830"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ace513fa30d485cfd25c11a9e4"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2be31dceef604539db316f6613"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3e0dceb48c719366b370ba0f14"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7e79d280d92d8b9ce60089de5d"`,
    );
    await queryRunner.query(`DROP TABLE "suppliers"`);
    await queryRunner.query(
      `DROP TYPE "public"."suppliers_approvalstatus_enum"`,
    );
    await queryRunner.query(`DROP TABLE "supplier_documents"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_be1db2669c04cb2e1bcfbbcfc9"`,
    );
    await queryRunner.query(`DROP TABLE "supplier_document_types"`);
  }
}
