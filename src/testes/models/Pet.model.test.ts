import { DataSource, Repository } from "typeorm";
import { TestDataSource } from "../../testes/test-data-source";
import { Pet } from "../../models/Pet";
import { Client } from "../../models/Client";
import { Attendant } from "../../models/Attendant";

describe('Pet Model Test', () => {
    let connection: DataSource;
    let petRepository: Repository<Pet>;
    let clientRepository: Repository<Client>;
    let attendantRepository: Repository<Attendant>;

    beforeAll(async () => {
        connection = await TestDataSource.initialize();
        petRepository = connection.getRepository(Pet);
        clientRepository = connection.getRepository(Client);
        attendantRepository = connection.getRepository(Attendant);
    });

    afterAll(async () => {
        await connection.destroy();
    });

    beforeEach(async () => {
        // Limpa as tabelas na ordem correta para evitar erros de chave estrangeira
        await petRepository.query(`DELETE FROM "pet"`);
        await clientRepository.query(`DELETE FROM "client"`);
        await attendantRepository.query(`DELETE FROM "attendant"`);
    });

    it('deve criar um pet e associá-lo a um cliente e a um atendente', async () => {
        // 1. Cria e salva o cliente e o atendente primeiro
        const client = clientRepository.create({ name: 'Dono do Pet', email: 'dono@test.com' });
        await clientRepository.save(client);

        const attendant = attendantRepository.create({ name: 'Atendente do Pet', email: 'atendente@test.com', password: '123' });
        await attendantRepository.save(attendant);

        // 2. Cria o pet e associa as entidades salvas
        const petData = {
            name: 'Fido',
            species: 'Cachorro',
            client: client,       // Associa a instância do cliente
            attendant: attendant  // Associa a instância do atendente
        };

        const pet = petRepository.create(petData);
        await petRepository.save(pet);

        // 3. Busca o pet e verifica se os relacionamentos foram carregados corretamente
        const savedPet = await petRepository.findOne({
            where: { id: pet.id },
            relations: ['client', 'attendant'] // Pede para o TypeORM carregar os relacionamentos
        });

        expect(savedPet).toBeDefined();
        expect(savedPet?.name).toBe('Fido');
        expect(savedPet?.client).toBeDefined();
        expect(savedPet?.client.id).toBe(client.id);
        expect(savedPet?.attendant).toBeDefined();
        expect(savedPet?.attendant?.id).toBe(attendant.id);
    });
});