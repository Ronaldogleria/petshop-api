import { DataSource, Repository } from "typeorm";
import { TestDataSource } from "../config/test-data-source";
import { Pet } from "../models/Pet";
import { Attendant } from "../models/Attendant";
import * as bcrypt from 'bcryptjs';

describe('Attendant Model Test', () => {
    let connection: DataSource;
    let attendantRepository: Repository<Attendant>;

    beforeAll(async () => {
        connection = await TestDataSource.initialize();
        attendantRepository = connection.getRepository(Attendant);
    });

    afterAll(async () => {
        await connection.destroy();
    });

    beforeEach(async () => {
        const petRepository = connection.getRepository(Pet);
        await petRepository.query(`DELETE FROM "pet"`);
        await attendantRepository.query(`DELETE FROM "attendant"`);
    });

    it('deve criar e salvar um atendente com sucesso', async () => {
        const attendantData = {
            name: 'Ana Atendente',
            email: 'ana.atendente@test.com',
            password: 'senha_super_secreta'
        };

        const attendant = attendantRepository.create(attendantData);
        // Simula o hash da senha que aconteceria na lógica de serviço/controller
        attendant.password = await bcrypt.hash(attendant.password, 8);
        await attendantRepository.save(attendant);

        const savedAttendant = await attendantRepository.findOneBy({ id: attendant.id });

        expect(savedAttendant).toBeDefined();
        expect(savedAttendant?.name).toBe(attendantData.name);
        expect(await bcrypt.compare(attendantData.password, savedAttendant!.password)).toBe(true);
    });

    it('deve falhar ao tentar salvar dois atendentes com o mesmo email', async () => {
        const attendant1 = attendantRepository.create({ name: 'Atendente Um', email: 'repetido@test.com', password: '123' });
        await attendantRepository.save(attendant1);

        const attendant2 = attendantRepository.create({ name: 'Atendente Dois', email: 'repetido@test.com', password: '456' });

        await expect(attendantRepository.save(attendant2)).rejects.toThrow();
    });
});