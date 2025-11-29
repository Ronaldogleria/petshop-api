import { DataSource, Repository } from "typeorm";
import { TestDataSource } from "../config/test-data-source";
import { Pet } from "../models/Pet";
import { Client } from "../models/Client";

describe('Client Model Test', () => {
    let connection: DataSource;
    let clientRepository: Repository<Client>;

    beforeAll(async () => {
        connection = await TestDataSource.initialize();
        clientRepository = connection.getRepository(Client);
    });

    afterAll(async () => {
        await connection.destroy();
    });

    beforeEach(async () => {
        // Limpa as tabelas na ordem correta para evitar erros de chave estrangeira
        const petRepository = connection.getRepository(Pet);
        await petRepository.query(`DELETE FROM "pet"`);
        await clientRepository.query(`DELETE FROM "client"`);
    });

    it('deve criar e salvar um cliente com sucesso', async () => {
        const clientData = {
            name: 'João da Silva',
            email: 'joao.silva@test.com',
            phone: '11999998888'
        };

        const client = clientRepository.create(clientData);
        await clientRepository.save(client);

        const savedClient = await clientRepository.findOneBy({ id: client.id });

        expect(savedClient).toBeDefined();
        expect(savedClient?.id).toBe(client.id);
        expect(savedClient?.name).toBe(clientData.name);
    });

    it('deve falhar ao tentar salvar dois clientes com o mesmo email', async () => {
        const client1 = clientRepository.create({ name: 'Cliente Um', email: 'repetido@test.com' });
        await clientRepository.save(client1);

        const client2 = clientRepository.create({ name: 'Cliente Dois', email: 'repetido@test.com' });

        // Espera que a operação de salvar o segundo cliente lance um erro
        await expect(clientRepository.save(client2)).rejects.toThrow();
    });
});