import 'dotenv/config';
import { DataSource } from "typeorm";
import { Attendant } from "../models/Attendant";
import { Client } from "../models/Client";
import { Pet } from "../models/Pet";

export const TestDataSource = new DataSource({
    type: "postgres",
    // Usaremos as mesmas variáveis do banco principal, 
    // mas apontando para um banco de dados diferente.
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE_TEST, // Variável específica para o banco de teste
    synchronize: true,   // Cria o schema do banco a cada conexão (ótimo para testes)
    logging: false,      // Desabilita os logs do SQL nos testes
    entities: [
        Attendant,
        Client,
        Pet
    ],
    migrations: [],
    subscribers: [],
});