import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Pet } from "./Pet";
import * as bcrypt from "bcryptjs";

@Entity()
export class Attendant {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column({ unique: true })
    email!: string;

    @Column()
    password!: string;

    @OneToMany(() => Pet, pet => pet.attendant)
    pets!: Pet[];

    // Método para hashear a senha antes de salvar
    public async hashPassword() {
        this.password = await bcrypt.hash(this.password, 10);
    }

    // Método para comparar a senha
    public async comparePassword(password: string): Promise<boolean> {
        return bcrypt.compare(password, this.password);
    }
}
