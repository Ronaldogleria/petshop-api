import "reflect-metadata";
import { DataSource } from "typeorm";
import { Attendant } from "../models/Attendant";
import { Client } from "../models/Client";
import { Pet } from "../models/Pet";

// Carrega as variáveis de ambiente do arquivo .env
import 'dotenv/config';

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "admin",
    database: process.env.DB_DATABASE || "petshop_db",
    synchronize: true, // Desabilitado para usar migrations
    logging: false,
    entities: [Attendant, Client, Pet],
    migrations: ["src/migrations/*.ts"],
    subscribers: [],
});