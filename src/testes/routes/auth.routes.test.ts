import request from 'supertest';
import { TestDataSource } from '../../testes/test-data-source';
import { DataSource } from 'typeorm';

// Mock da AppDataSource para usar a TestDataSource em toda a aplicação durante os testes
jest.mock('../../config/data-source', () => {
    return {
        AppDataSource: TestDataSource
    }
});

import { app } from '../../server';

describe('Testes de Rotas de Autenticação - /api/auth', () => {
    let connection: DataSource;

    beforeAll(async () => {
        connection = await TestDataSource.initialize();
    });

    afterAll(async () => {
        await connection.destroy();
    });

    beforeEach(async () => {
        // Limpa a tabela de atendentes antes de cada teste para garantir isolamento
        await connection.query(`DELETE FROM "attendant"`);
    });

    describe('POST /register', () => {
        it('Deve registrar um novo atendente com sucesso', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Auth Test User',
                    email: 'auth.test@example.com',
                    password: 'password123'
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('id');
            expect(response.body.message).toBe('Atendente registrado com sucesso.');
        });

        it('Deve retornar 409 se o e-mail já existir', async () => {
            // Primeiro, registra um usuário
            await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Existing User',
                    email: 'existing@example.com',
                    password: 'password123'
                });

            // Tenta registrar novamente com o mesmo e-mail
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Another User',
                    email: 'existing@example.com',
                    password: 'password456'
                });

            expect(response.status).toBe(409);
            expect(response.body.message).toBe('E-mail já cadastrado.');
        });
    });

    describe('POST /login', () => {
        beforeEach(async () => {
            // Garante que um usuário exista para os testes de login
            await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Login User',
                    email: 'login@example.com',
                    password: 'password123'
                });
        });

        it('Deve autenticar com sucesso e retornar um token', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'login@example.com',
                    password: 'password123'
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token');
        });
    });
});