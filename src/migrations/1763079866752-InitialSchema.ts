import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1763079866752 implements MigrationInterface {
    name = 'InitialSchema1763079866752'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "client" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "email" character varying NOT NULL, "phone" character varying, CONSTRAINT "UQ_6436cc6b79593760b9ef921ef12" UNIQUE ("email"), CONSTRAINT "PK_96da49381769303a6515a8785c7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "pet" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "species" character varying NOT NULL, "breed" character varying, "birthDate" date, "clientId" integer, "attendantId" integer, CONSTRAINT "PK_b1ac2e88e89b9480e0c5b53fa60" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "attendant" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, CONSTRAINT "UQ_347a4e4bd2f80f8bde1813a780c" UNIQUE ("email"), CONSTRAINT "PK_0f816ac9013a3351bfb034bdc2a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "pet" ADD CONSTRAINT "FK_a29a3a6329bcd2dd895892afd29" FOREIGN KEY ("clientId") REFERENCES "client"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pet" ADD CONSTRAINT "FK_fd6cd75c5853980d7dccb7d3341" FOREIGN KEY ("attendantId") REFERENCES "attendant"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pet" DROP CONSTRAINT "FK_fd6cd75c5853980d7dccb7d3341"`);
        await queryRunner.query(`ALTER TABLE "pet" DROP CONSTRAINT "FK_a29a3a6329bcd2dd895892afd29"`);
        await queryRunner.query(`DROP TABLE "attendant"`);
        await queryRunner.query(`DROP TABLE "pet"`);
        await queryRunner.query(`DROP TABLE "client"`);
    }

}
