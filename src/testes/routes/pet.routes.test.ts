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

describe('Testes de Rotas de Pets - /api/pets', () => {
    let connection: DataSource;
    let token: string;
    let testClientId: number;
    let createdPetId: number;

    beforeAll(async () => {
        connection = await TestDataSource.initialize();

        // Limpeza inicial
        await connection.query(`DELETE FROM "pet"`);
        await connection.query(`DELETE FROM "client"`);
        await connection.query(`DELETE FROM "attendant"`);

        // 1. Cria um atendente e obtém o token
        await request(app).post('/api/auth/register').send({
            name: 'Pet Test Attendant',
            email: 'pet.attendant.test@example.com',
            password: 'password123'
        });
        const loginResponse = await request(app).post('/api/auth/login').send({
            email: 'pet.attendant.test@example.com',
            password: 'password123'
        });
        token = loginResponse.body.token;

        // 2. Cria um cliente para ser o dono do pet
        const clientResponse = await request(app)
            .post('/api/clients')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Dono do Pet',
                email: 'dono.pet@test.com'
            });
        testClientId = clientResponse.body.id;
    });

    afterAll(async () => {
        await connection.destroy();
    });

    it('POST / - Deve criar um novo pet', async () => {
        const response = await request(app)
            .post('/api/pets')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Rex',
                species: 'Cachorro',
                clientId: testClientId // Usa o ID do cliente criado no beforeAll
            });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body.name).toBe('Rex');
        expect(response.body.client.id).toBe(testClientId);
        createdPetId = response.body.id;
    });

    it('GET / - Deve retornar uma lista de pets', async () => {
        const response = await request(app)
            .get('/api/pets')
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
    });

    it('GET /:id - Deve retornar um pet específico', async () => {
        const response = await request(app)
            .get(`/api/pets/${createdPetId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.id).toBe(createdPetId);
    });

    it('PUT /:id - Deve atualizar um pet', async () => {
        const response = await request(app)
            .put(`/api/pets/${createdPetId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Rex Atualizado' });

        expect(response.status).toBe(200);
        expect(response.body.name).toBe('Rex Atualizado');
    });

    it('DELETE /:id - Deve deletar um pet', async () => {
        const response = await request(app)
            .delete(`/api/pets/${createdPetId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(204);
    });

    it('GET /:id - Deve retornar 404 para um pet deletado', async () => {
        const response = await request(app)
            .get(`/api/pets/${createdPetId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(404);
    });
});