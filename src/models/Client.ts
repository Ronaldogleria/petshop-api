import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Pet } from "./Pet";

@Entity()
export class Client {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column({ unique: true })
    email!: string;

    @Column({ nullable: true })
    phone!: string;

    @OneToMany(() => Pet, pet => pet.client)
    pets!: Pet[];
}
