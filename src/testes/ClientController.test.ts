import { ClientController } from '../controllers/ClientController';
import { AppDataSource } from '../config/data-source';
import { Client } from '../models/Client';
import { Request, Response } from 'express';

// Mock do AppDataSource para evitar conexão real com o banco de dados
jest.mock('../config/data-source', () => ({
    AppDataSource: {
        getRepository: jest.fn().mockReturnValue({
            // Ajusta o mock para retornar uma instância real de Client
            create: jest.fn(dto => {
                const client = new Client();
                Object.assign(client, dto);
                return client;
            }),
            save: jest.fn(),
            find: jest.fn(),
            findOneBy: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        }),
    },
}));

describe('ClientController', () => {
    let clientController: ClientController;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let clientRepositoryMock: any;

    beforeEach(() => {
        clientController = new ClientController();
        clientRepositoryMock = AppDataSource.getRepository(Client);

        // Simula um usuário autenticado, como o authMiddleware faria
        mockRequest = {
            user: { id: 1, email: 'test@attendant.com' },
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
        it('deve criar um cliente com sucesso e retornar 201', async () => {
            mockRequest.body = { name: 'Novo Cliente', email: 'novo@cliente.com', phone: '123456789' };
            
            // O controller retorna uma instância de Client, então o teste deve esperar o mesmo.
            const expectedClient = new Client();
            Object.assign(expectedClient, { id: 1, ...mockRequest.body });

            clientRepositoryMock.findOneBy.mockResolvedValue(null);
            clientRepositoryMock.save.mockResolvedValue(expectedClient);

            await clientController.create(mockRequest as Request, mockResponse as Response);

            expect(clientRepositoryMock.save).toHaveBeenCalledWith(expect.any(Client));
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(expectedClient);
        });

        it('deve retornar 400 se faltarem campos obrigatórios', async () => {
            mockRequest.body = { name: 'Cliente Incompleto' }; // Falta email

            await clientController.create(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Nome e email são obrigatórios.' });
        });

        it('deve retornar 409 se o email já existir', async () => {
            mockRequest.body = { name: 'Cliente Repetido', email: 'repetido@cliente.com' };
            clientRepositoryMock.findOneBy.mockResolvedValue(new Client());

            await clientController.create(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(409);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Email já cadastrado.' });
        });
    });

    describe('getAll', () => {
        it('deve retornar uma lista de clientes e status 200', async () => {
            const clients = [{ id: 1, name: 'Cliente 1' }, { id: 2, name: 'Cliente 2' }];
            clientRepositoryMock.find.mockResolvedValue(clients);

            await clientController.getAll(mockRequest as Request, mockResponse as Response);

            expect(clientRepositoryMock.find).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(clients);
        });
    });

    describe('getById', () => {
        it('deve retornar um cliente e status 200 se encontrado', async () => {
            mockRequest.params = { id: '1' };
            const client = { id: 1, name: 'Cliente Encontrado' };
            clientRepositoryMock.findOneBy.mockResolvedValue(client);

            await clientController.getById(mockRequest as Request, mockResponse as Response);

            expect(clientRepositoryMock.findOneBy).toHaveBeenCalledWith({ id: 1 });
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(client);
        });

        it('deve retornar 404 se o cliente não for encontrado', async () => {
            mockRequest.params = { id: '99' };
            clientRepositoryMock.findOneBy.mockResolvedValue(null);

            await clientController.getById(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Cliente não encontrado.' });
        });
    });

    describe('update', () => {
        it('deve atualizar um cliente e retornar 200', async () => {
            mockRequest.params = { id: '1' };
            mockRequest.body = { name: 'Cliente Atualizado' };
            const updatedClient = { id: 1, name: 'Cliente Atualizado' };

            clientRepositoryMock.findOneBy.mockResolvedValue({ id: 1, name: 'Cliente Antigo' });
            clientRepositoryMock.update.mockResolvedValue({ affected: 1 });
            clientRepositoryMock.findOneBy.mockResolvedValue(updatedClient); // Simula a busca após o update

            await clientController.update(mockRequest as Request, mockResponse as Response);

            expect(clientRepositoryMock.update).toHaveBeenCalledWith(1, mockRequest.body);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(updatedClient);
        });

        it('deve retornar 404 se o cliente a ser atualizado não for encontrado', async () => {
            mockRequest.params = { id: '99' };
            mockRequest.body = { name: 'Nome Fantasma' };
            clientRepositoryMock.findOneBy.mockResolvedValue(null);

            await clientController.update(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Cliente não encontrado.' });
        });
    });

    describe('delete', () => {
        it('deve deletar um cliente e retornar 204', async () => {
            mockRequest.params = { id: '1' };
            clientRepositoryMock.delete.mockResolvedValue({ affected: 1 });

            await clientController.delete(mockRequest as Request, mockResponse as Response);

            expect(clientRepositoryMock.delete).toHaveBeenCalledWith(1);
            expect(mockResponse.status).toHaveBeenCalledWith(204);
            expect(mockResponse.send).toHaveBeenCalled();
        });

        it('deve retornar 404 se o cliente a ser deletado não for encontrado', async () => {
            mockRequest.params = { id: '99' };
            clientRepositoryMock.delete.mockResolvedValue({ affected: 0 });

            await clientController.delete(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Cliente não encontrado.' });
        });
    });
});