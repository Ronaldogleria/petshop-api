import { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { Client } from '../models/Client';

const clientRepository = AppDataSource.getRepository(Client);

export class ClientController {
    async create(req: Request, res: Response) {
        const { name, email, phone } = req.body;

        if (!name || !email) {
            return res.status(400).json({ message: 'Nome e email são obrigatórios.' });
        }

        try {
            const existingClient = await clientRepository.findOneBy({ email });
            if (existingClient) {
                return res.status(409).json({ message: 'Email já cadastrado.' });
            }

            const client = clientRepository.create({ name, email, phone });
            const savedClient = await clientRepository.save(client);

            return res.status(201).json(savedClient);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao criar cliente.' });
        }
    }

    async getAll(req: Request, res: Response) {
        try {
            const clients = await clientRepository.find();
            return res.status(200).json(clients);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao buscar clientes.' });
        }
    }

    async getById(req: Request, res: Response) {
        const { id } = req.params;
        try {
            const client = await clientRepository.findOneBy({ id: parseInt(id) });
            if (!client) {
                return res.status(404).json({ message: 'Cliente não encontrado.' });
            }
            return res.status(200).json(client);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao buscar cliente.' });
        }
    }

    async update(req: Request, res: Response) {
        const { id } = req.params;
        try {
            const client = await clientRepository.findOneBy({ id: parseInt(id) });
            if (!client) {
                return res.status(404).json({ message: 'Cliente não encontrado.' });
            }
            await clientRepository.update(parseInt(id), req.body);
            const updatedClient = await clientRepository.findOneBy({ id: parseInt(id) });
            return res.status(200).json(updatedClient);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao atualizar cliente.' });
        }
    }

    async delete(req: Request, res: Response) {
        const { id } = req.params;
        try {
            const result = await clientRepository.delete(parseInt(id));
            if (result.affected === 0) {
                return res.status(404).json({ message: 'Cliente não encontrado.' });
            }
            return res.status(204).send();
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao deletar cliente.' });
        }
    }
}
