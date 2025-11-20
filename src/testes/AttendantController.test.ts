import { AttendantController } from '../controllers/AttendantController';
import { AppDataSource } from '../config/data-source';
import { Attendant } from '../models/Attendant';
import { Request, Response } from 'express';

// Mock do AppDataSource para evitar conexão real com o banco de dados
jest.mock('../config/data-source', () => ({
    AppDataSource: {
        getRepository: jest.fn().mockReturnValue({
            findOneBy: jest.fn(),
            save: jest.fn(),
        }),
        initialize: jest.fn().mockResolvedValue(true),
    },
}));

// Mock do bcryptjs para evitar operações de hash reais
jest.mock('bcryptjs', () => ({
    hash: jest.fn().mockResolvedValue('hashed_password'),
    compare: jest.fn(),
}));

// Mock do jsonwebtoken
jest.mock('jsonwebtoken', () => ({
    sign: jest.fn().mockReturnValue('mocked_token'),
}));

describe('AttendantController', () => {
    let attendantController: AttendantController;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let attendantRepositoryMock: any;

    beforeEach(() => {
        // Define a variável de ambiente para os testes
        process.env.JWT_SECRET = 'test_secret_key';

        attendantController = new AttendantController();
        attendantRepositoryMock = AppDataSource.getRepository(Attendant);
        
        mockRequest = {};
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
    });

    afterEach(() => {
        // Limpa a variável de ambiente após os testes
        delete process.env.JWT_SECRET;
        jest.clearAllMocks();
    });

    describe('register', () => {
        it('deve retornar 400 se faltarem campos obrigatórios', async () => {
            mockRequest.body = { name: 'Test', email: 'test@example.com' }; // Falta a senha

            await attendantController.register(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Todos os campos são obrigatórios.' });
        });

        it('deve retornar 409 se o e-mail já estiver cadastrado', async () => {
            mockRequest.body = { name: 'Test', email: 'test@example.com', password: 'password123' };
            attendantRepositoryMock.findOneBy.mockResolvedValue(new Attendant());

            await attendantController.register(mockRequest as Request, mockResponse as Response);

            expect(attendantRepositoryMock.findOneBy).toHaveBeenCalledWith({ email: 'test@example.com' });
            expect(mockResponse.status).toHaveBeenCalledWith(409);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'E-mail já cadastrado.' });
        });

        it('deve registrar o atendente com sucesso e retornar 201', async () => {
            mockRequest.body = { name: 'Test', email: 'test@example.com', password: 'password123' };
            attendantRepositoryMock.findOneBy.mockResolvedValue(null);
            attendantRepositoryMock.save.mockImplementation((attendant: Attendant) => {
                attendant.id = 1;
                return attendant;
            });

            await attendantController.register(mockRequest as Request, mockResponse as Response);

            expect(attendantRepositoryMock.findOneBy).toHaveBeenCalledWith({ email: 'test@example.com' });
            expect(attendantRepositoryMock.save).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                id: 1,
                name: 'Test',
                email: 'test@example.com',
                message: 'Atendente registrado com sucesso.'
            }));
        });
    });

    describe('login', () => {
        it('deve retornar 400 se faltarem e-mail ou senha', async () => {
            mockRequest.body = { email: 'test@example.com' }; // Falta a senha

            await attendantController.login(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'E-mail e senha são obrigatórios.' });
        });

        it('deve retornar 401 se o atendente não for encontrado', async () => {
            mockRequest.body = { email: 'nonexistent@example.com', password: 'password123' };
            attendantRepositoryMock.findOneBy.mockResolvedValue(null);

            await attendantController.login(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'E-mail ou senha inválidos.' });
        });

        it('deve retornar 401 se a senha for inválida', async () => {
            mockRequest.body = { email: 'test@example.com', password: 'wrong_password' };
            const mockAttendant = new Attendant();
            mockAttendant.comparePassword = jest.fn().mockResolvedValue(false);
            attendantRepositoryMock.findOneBy.mockResolvedValue(mockAttendant);

            await attendantController.login(mockRequest as Request, mockResponse as Response);

            expect(mockAttendant.comparePassword).toHaveBeenCalledWith('wrong_password');
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'E-mail ou senha inválidos.' });
        });

        it('deve retornar o token JWT em caso de sucesso', async () => {
            mockRequest.body = { email: 'test@example.com', password: 'password123' };
            const mockAttendant = new Attendant();
            mockAttendant.id = 1;
            mockAttendant.email = 'test@example.com';
            mockAttendant.comparePassword = jest.fn().mockResolvedValue(true);
            attendantRepositoryMock.findOneBy.mockResolvedValue(mockAttendant);

            await attendantController.login(mockRequest as Request, mockResponse as Response);

            expect(mockAttendant.comparePassword).toHaveBeenCalledWith('password123');
            expect(require('jsonwebtoken').sign).toHaveBeenCalledWith(
                { id: 1, email: 'test@example.com' },
                'test_secret_key', // Usa a chave definida no setup do teste
                { expiresIn: '1h' }
            );
            expect(mockResponse.json).toHaveBeenCalledWith({ token: 'mocked_token' });
        });
    });
});
