import "reflect-metadata";
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Client } from "./Client";
import { Attendant } from "./Attendant";

@Entity()
export class Pet {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column()
    species!: string;

    @Column({ nullable: true })
    breed?: string;

    @Column({ type: 'date', nullable: true })
    birthDate?: Date;

    @ManyToOne(() => Client, client => client.pets, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "clientId" })
    client!: Client;

    @ManyToOne(() => Attendant, attendant => attendant.pets, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: "attendantId" })
    attendant?: Attendant;
}
