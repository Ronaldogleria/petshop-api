import { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { Attendant } from '../models/Attendant';
import * as jwt from 'jsonwebtoken';

const attendantRepository = AppDataSource.getRepository(Attendant);

export class AttendantController {
    // Cria um novo atendente (Registro)
    async register(req: Request, res: Response) {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
        }

        try {
            const existingAttendant = await attendantRepository.findOneBy({ email });
            if (existingAttendant) {
                return res.status(409).json({ message: 'E-mail já cadastrado.' });
            }

            const attendant = new Attendant();
            attendant.name = name;
            attendant.email = email;
            attendant.password = password; // A senha será hasheada no método hashPassword

            await attendant.hashPassword();
            await attendantRepository.save(attendant);

            return res.status(201).json({ 
                id: attendant.id, 
                name: attendant.name, 
                email: attendant.email,
                message: 'Atendente registrado com sucesso.' 
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao registrar atendente.' });
        }
    }

    // Autentica um atendente (Login)
    async login(req: Request, res: Response) {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
        }

        try {
            const attendant = await attendantRepository.findOneBy({ email });

            if (!attendant) {
                return res.status(401).json({ message: 'E-mail ou senha inválidos.' });
            }

            const isPasswordValid = await attendant.comparePassword(password);

            if (!isPasswordValid) {
                return res.status(401).json({ message: 'E-mail ou senha inválidos.' });
            }

            // O segredo deve ser carregado de uma variável de ambiente em um projeto real
            const secret = process.env.JWT_SECRET || 'super_secret_key';
            const token = jwt.sign(
                { id: attendant.id, email: attendant.email },
                secret,
                { expiresIn: '1h' }
            );

            return res.json({ token });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao realizar login.' });
        }
    }
}
