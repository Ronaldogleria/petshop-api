import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

// Define uma interface para o payload do JWT
interface JwtPayload {
    id: number;
    email: string;
}

// Estende a interface Request do Express para incluir o usuário autenticado
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

// Middleware de autenticação
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: 'Token não fornecido.' });
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ message: 'Formato de token inválido.' });
    }

    try {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            // Loga o erro no servidor para facilitar o debug, sem expor detalhes ao cliente.
            console.error('FATAL_ERROR: JWT_SECRET não foi definido nas variáveis de ambiente.');
            // Retorna um erro genérico para o cliente.
            return res.status(500).json({ message: 'Erro interno de configuração do servidor.' });
        }
        const decoded = jwt.verify(token, secret) as JwtPayload;
        
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token inválido ou expirado.' });
    }
};
