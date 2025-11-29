import { AppDataSource } from '../../config/data-source';
import { Pet } from '../../models/Pet';
import { Client } from '../../models/Client';
import { Attendant } from '../../models/Attendant';
import { Request, Response } from 'express';

// Mocks para os repositórios
const petRepositoryMock = {
    // Adiciona o mock para o método create
    create: jest.fn(dto => {
        const pet = new Pet();
        Object.assign(pet, dto);
        return pet;
    }),
    save: jest.fn(),
    find: jest.fn(),
    findOneBy: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
};
const clientRepositoryMock = {
    findOneBy: jest.fn(),
};
const attendantRepositoryMock = {
    findOneBy: jest.fn(),
};

// Mock do AppDataSource para retornar o repositório correto para cada entidade
jest.mock('../../config/data-source', () => ({
    AppDataSource: {
        getRepository: jest.fn((entity: any) => {
            // Lazy require para evitar erros de inicialização (ReferenceError)
            if (entity.name === 'Pet') return petRepositoryMock;
            if (entity.name === 'Client') return clientRepositoryMock;
            if (entity.name === 'Attendant') return attendantRepositoryMock;
        }),
    },
}));

// Importa o controller APÓS a configuração dos mocks
import { PetController } from '../../controllers/PetController';

describe('PetController', () => {
    let petController: PetController;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;

    beforeEach(() => {
        petController = new PetController();

        // Simula um atendente autenticado no request
        mockRequest = {
            user: { id: 1, email: 'atendente@teste.com' },
        };

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('deve criar um pet com sucesso e retornar 201', async () => {
            mockRequest.body = { name: 'Rex', species: 'Cachorro', clientId: 1 };
            const mockClient = { id: 1, name: 'Dono do Rex' };
            const mockAttendant = { id: 1, name: 'Atendente' };
            const savedPet = { id: 1, ...mockRequest.body, attendant: mockAttendant };

            clientRepositoryMock.findOneBy.mockResolvedValue(mockClient);
            attendantRepositoryMock.findOneBy.mockResolvedValue(mockAttendant);
            petRepositoryMock.save.mockResolvedValue(savedPet);

            await petController.create(mockRequest as Request, mockResponse as Response);

            expect(clientRepositoryMock.findOneBy).toHaveBeenCalledWith({ id: 1 });
            expect(attendantRepositoryMock.findOneBy).toHaveBeenCalledWith({ id: 1 });
            expect(petRepositoryMock.save).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(savedPet);
        });

        it('deve retornar 400 se faltarem campos obrigatórios', async () => {
            mockRequest.body = { name: 'Rex' }; // Faltam species e clientId

            await petController.create(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Nome, espécie e ID do cliente são obrigatórios.' });
        });

        it('deve retornar 404 se o cliente não for encontrado', async () => {
            mockRequest.body = { name: 'Rex', species: 'Cachorro', clientId: 99 };
            clientRepositoryMock.findOneBy.mockResolvedValue(null);

            await petController.create(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Cliente não encontrado.' });
        });
    });

    describe('getAll', () => {
        it('deve retornar uma lista de pets e status 200', async () => {
            const pets = [{ id: 1, name: 'Rex' }, { id: 2, name: 'Miau' }];
            petRepositoryMock.find.mockResolvedValue(pets);

            await petController.getAll(mockRequest as Request, mockResponse as Response);

            expect(petRepositoryMock.find).toHaveBeenCalledWith({ relations: ['client', 'attendant'] });
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(pets);
        });
    });

    describe('getById', () => {
        it('deve retornar um pet e status 200 se encontrado', async () => {
            mockRequest.params = { id: '1' };
            const pet = { id: 1, name: 'Rex' };
            petRepositoryMock.findOneBy.mockResolvedValue(pet);

            await petController.getById(mockRequest as Request, mockResponse as Response);

            expect(petRepositoryMock.findOneBy).toHaveBeenCalledWith({ id: 1 });
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(pet);
        });

        it('deve retornar 404 se o pet não for encontrado', async () => {
            mockRequest.params = { id: '99' };
            petRepositoryMock.findOneBy.mockResolvedValue(null);

            await petController.getById(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Pet não encontrado.' });
        });
    });

    describe('update', () => {
        it('deve atualizar um pet e retornar 200', async () => {
            mockRequest.params = { id: '1' };
            mockRequest.body = { name: 'Rex Atualizado' };
            const updatedPet = { id: 1, name: 'Rex Atualizado' };

            petRepositoryMock.update.mockResolvedValue({ affected: 1 });
            petRepositoryMock.findOneBy.mockResolvedValue(updatedPet);

            await petController.update(mockRequest as Request, mockResponse as Response);

            expect(petRepositoryMock.update).toHaveBeenCalledWith(1, mockRequest.body);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(updatedPet);
        });

        it('deve retornar 404 se o pet a ser atualizado não for encontrado', async () => {
            mockRequest.params = { id: '99' };
            mockRequest.body = { name: 'Pet Fantasma' };
            petRepositoryMock.update.mockResolvedValue({ affected: 0 });

            await petController.update(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Pet não encontrado.' });
        });
    });

    describe('delete', () => {
        it('deve deletar um pet e retornar 204', async () => {
            mockRequest.params = { id: '1' };
            petRepositoryMock.delete.mockResolvedValue({ affected: 1 });

            await petController.delete(mockRequest as Request, mockResponse as Response);

            expect(petRepositoryMock.delete).toHaveBeenCalledWith(1);
            expect(mockResponse.status).toHaveBeenCalledWith(204);
            expect(mockResponse.send).toHaveBeenCalled();
        });

        it('deve retornar 404 se o pet a ser deletado não for encontrado', async () => {
            mockRequest.params = { id: '99' };
            petRepositoryMock.delete.mockResolvedValue({ affected: 0 });

            await petController.delete(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Pet não encontrado.' });
        });
    });
});
