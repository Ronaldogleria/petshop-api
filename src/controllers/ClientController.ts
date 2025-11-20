import { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { Client } from '../models/Client';

const clientRepository = AppDataSource.getRepository(Client);

export class ClientController {
    // Criar Cliente
    async create(req: Request, res: Response) {
        const { name, email, phone } = req.body;

        if (!name || !email) {
            return res.status(400).json({ message: 'Nome e e-mail são obrigatórios.' });
        }

        try {
            const existingClient = await clientRepository.findOneBy({ email });
            if (existingClient) {
                return res.status(409).json({ message: 'E-mail de cliente já cadastrado.' });
            }

            const client = clientRepository.create({ name, email, phone });
            await clientRepository.save(client);

            return res.status(201).json(client);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao criar cliente.' });
        }
    }

    // Listar Clientes
    async findAll(req: Request, res: Response) {
        try {
            const clients = await clientRepository.find({ relations: ['pets'] });
            return res.json(clients);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao buscar clientes.' });
        }
    }

    // Buscar Cliente por ID
    async findOne(req: Request, res: Response) {
        const id = parseInt(req.params.id);

        try {
            const client = await clientRepository.findOne({ 
                where: { id },
                relations: ['pets']
            });

            if (!client) {
                return res.status(404).json({ message: 'Cliente não encontrado.' });
            }

            return res.json(client);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao buscar cliente.' });
        }
    }

    // Atualizar Cliente
    async update(req: Request, res: Response) {
        const id = parseInt(req.params.id);
        const { name, email, phone } = req.body;

        try {
            let client = await clientRepository.findOneBy({ id });

            if (!client) {
                return res.status(404).json({ message: 'Cliente não encontrado.' });
            }

            clientRepository.merge(client, { name, email, phone });
            const result = await clientRepository.save(client);

            return res.json(result);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao atualizar cliente.' });
        }
    }

    // Deletar Cliente
    async remove(req: Request, res: Response) {
        const id = parseInt(req.params.id);

        try {
            const clientToRemove = await clientRepository.findOneBy({ id });

            if (!clientToRemove) {
                return res.status(404).json({ message: 'Cliente não encontrado.' });
            }

            await clientRepository.remove(clientToRemove);

            return res.status(204).send();
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao deletar cliente.' });
        }
    }
}
