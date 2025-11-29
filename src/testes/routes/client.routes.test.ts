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

describe('Testes de Rotas de Clientes - /api/clients', () => {
    let connection: DataSource;
    let token: string;
    let createdClientId: number;
 
    beforeAll(async () => {
        // Inicializa a conexão com o banco de dados de teste
        connection = await TestDataSource.initialize(); // Agora AppDataSource e TestDataSource são a mesma
 
        // Limpa as tabelas para garantir um estado limpo
        await connection.query(`DELETE FROM "pet"`);
        await connection.query(`DELETE FROM "client"`);
        await connection.query(`DELETE FROM "attendant"`);
 
        // 1. Registra um atendente para usar nos testes
        await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Test Attendant',
                email: 'attendant.test@example.com',
                password: 'password123'
            });
 
        // 2. Faz login para obter o token
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'attendant.test@example.com',
                password: 'password123'
            });
 
        token = loginResponse.body.token; // Salva o token para usar nos testes
    });

    afterAll(async () => {
        // Fecha a conexão com o banco de dados
        await connection.destroy();
    });

    it('POST / - Deve criar um novo cliente', async () => {
        const response = await request(app)
            .post('/api/clients')
            .set('Authorization', `Bearer ${token}`) // Usa o token de autenticação
            .send({
                name: 'Novo Cliente',
                email: 'novo.cliente@test.com',
                phone: '123456789'
            });
 
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body.name).toBe('Novo Cliente');
        createdClientId = response.body.id; // Salva o ID para usar nos outros testes
    });

    it('GET / - Deve retornar uma lista de clientes', async () => {
        const response = await request(app)
            .get('/api/clients')
            .set('Authorization', `Bearer ${token}`);
 
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
    });

    it('GET /:id - Deve retornar um cliente específico', async () => {
        const response = await request(app)
            .get(`/api/clients/${createdClientId}`)
            .set('Authorization', `Bearer ${token}`);
 
        expect(response.status).toBe(200);
        expect(response.body.id).toBe(createdClientId);
    });

    it('PUT /:id - Deve atualizar um cliente', async () => {
        const response = await request(app)
            .put(`/api/clients/${createdClientId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Cliente Atualizado' });
 
        expect(response.status).toBe(200);
        expect(response.body.name).toBe('Cliente Atualizado');
    });

    it('DELETE /:id - Deve deletar um cliente', async () => {
        const response = await request(app)
            .delete(`/api/clients/${createdClientId}`)
            .set('Authorization', `Bearer ${token}`);
 
        expect(response.status).toBe(204);
    });

    it('GET /:id - Deve retornar 404 para um cliente deletado', async () => {
        const response = await request(app)
            .get(`/api/clients/${createdClientId}`)
            .set('Authorization', `Bearer ${token}`);
 
        expect(response.status).toBe(404);
    });
});