import { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { Pet } from '../models/Pet';
import { Client } from '../models/Client';
import { Attendant } from '../models/Attendant';

const petRepository = AppDataSource.getRepository(Pet);
const clientRepository = AppDataSource.getRepository(Client);
const attendantRepository = AppDataSource.getRepository(Attendant);

export class PetController {
    // Criar Pet
    async create(req: Request, res: Response) {
        const { name, species, breed, birthDate, clientId } = req.body;
        const attendantId = req.user?.id; // ID do atendente logado

        if (!name || !species || !clientId) {
            return res.status(400).json({ message: 'Nome, espécie e ID do cliente são obrigatórios.' });
        }

        try {
            const client = await clientRepository.findOneBy({ id: clientId });
            if (!client) {
                return res.status(404).json({ message: 'Cliente não encontrado.' });
            }

            const attendant = attendantId ? await attendantRepository.findOneBy({ id: attendantId }) : undefined;

            const petData: any = { 
                name, 
                species, 
                breed, 
                birthDate, 
                client
            };
            if (attendant) {
                petData.attendant = attendant;
            }
            const pet = petRepository.create(petData);
            await petRepository.save(pet);

            return res.status(201).json(pet);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao criar pet.' });
        }
    }

    // Listar Pets
    async findAll(req: Request, res: Response) {
        try {
            const pets = await petRepository.find({ relations: ['client', 'attendant'] });
            return res.json(pets);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao buscar pets.' });
        }
    }

    // Buscar Pet por ID
    async findOne(req: Request, res: Response) {
        const id = parseInt(req.params.id);

        try {
            const pet = await petRepository.findOne({ 
                where: { id },
                relations: ['client', 'attendant']
            });

            if (!pet) {
                return res.status(404).json({ message: 'Pet não encontrado.' });
            }

            return res.json(pet);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao buscar pet.' });
        }
    }

    // Atualizar Pet
    async update(req: Request, res: Response) {
        const id = parseInt(req.params.id);
        const { name, species, breed, birthDate, clientId } = req.body;
        const attendantId = req.user?.id;

        try {
            let pet = await petRepository.findOne({ 
                where: { id },
                relations: ['client', 'attendant']
            });

            if (!pet) {
                return res.status(404).json({ message: 'Pet não encontrado.' });
            }

            let client = pet.client;
            if (clientId && clientId !== pet.client.id) {
                const newClient = await clientRepository.findOneBy({ id: clientId });
                if (!newClient) {
                    return res.status(404).json({ message: 'Novo cliente não encontrado.' });
                }
                client = newClient;
            }

            let attendant = pet.attendant;
            if (attendantId) {
                const newAttendant = await attendantRepository.findOneBy({ id: attendantId });
                if (newAttendant) {
                    attendant = newAttendant;
                }
            }

            const updateData: any = { 
                name, 
                species, 
                breed, 
                birthDate, 
                client,
                attendant
            };
            petRepository.merge(pet, updateData);
            const result = await petRepository.save(pet);

            return res.json(result);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao atualizar pet.' });
        }
    }

    // Deletar Pet
    async remove(req: Request, res: Response) {
        const id = parseInt(req.params.id);

        try {
            const petToRemove = await petRepository.findOneBy({ id });

            if (!petToRemove) {
                return res.status(404).json({ message: 'Pet não encontrado.' });
            }

            await petRepository.remove(petToRemove);

            return res.status(204).send();
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao deletar pet.' });
        }
    }
}
