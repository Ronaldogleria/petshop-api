import { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { Pet } from '../models/Pet';
import { Client } from '../models/Client';
import { Attendant } from '../models/Attendant';

const petRepository = AppDataSource.getRepository(Pet);
const clientRepository = AppDataSource.getRepository(Client);
const attendantRepository = AppDataSource.getRepository(Attendant);

export class PetController {
    async create(req: Request, res: Response) {
        const { name, species, breed, birthDate, clientId } = req.body;
        const attendantId = req.user!.id;

        if (!name || !species || !clientId) {
            return res.status(400).json({ message: 'Nome, espécie e ID do cliente são obrigatórios.' });
        }

        try {
            const client = await clientRepository.findOneBy({ id: clientId });
            if (!client) {
                return res.status(404).json({ message: 'Cliente não encontrado.' });
            }

            const attendant = await attendantRepository.findOneBy({ id: attendantId });
            if (!attendant) {
                return res.status(404).json({ message: 'Atendente não encontrado.' });
            }

            const pet = petRepository.create({ name, species, breed, birthDate, client, attendant });
            const savedPet = await petRepository.save(pet);

            return res.status(201).json(savedPet);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao criar pet.' });
        }
    }

    async getAll(req: Request, res: Response) {
        try {
            const pets = await petRepository.find({ relations: ['client', 'attendant'] });
            return res.status(200).json(pets);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao buscar pets.' });
        }
    }

    async getById(req: Request, res: Response) {
        const { id } = req.params;
        try {
            const pet = await petRepository.findOneBy({ id: parseInt(id) });
            if (!pet) {
                return res.status(404).json({ message: 'Pet não encontrado.' });
            }
            return res.status(200).json(pet);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao buscar pet.' });
        }
    }

    async update(req: Request, res: Response) {
        const { id } = req.params;
        try {
            const result = await petRepository.update(parseInt(id), req.body);
            if (result.affected === 0) {
                return res.status(404).json({ message: 'Pet não encontrado.' });
            }
            const updatedPet = await petRepository.findOneBy({ id: parseInt(id) });
            return res.status(200).json(updatedPet);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao atualizar pet.' });
        }
    }

    async delete(req: Request, res: Response) {
        const { id } = req.params;
        try {
            const result = await petRepository.delete(parseInt(id));
            if (result.affected === 0) {
                return res.status(404).json({ message: 'Pet não encontrado.' });
            }
            return res.status(204).send();
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao deletar pet.' });
        }
    }
}
