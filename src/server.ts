import 'dotenv/config';
import 'reflect-metadata';
import express from 'express';
import { AppDataSource } from './config/data-source';
import authRoutes from './routes/authRoutes';
import clientRoutes from './routes/clientRoutes';
import petRoutes from './routes/petRoutes';
import swaggerUi from 'swagger-ui-express';
// O arquivo swagger.json será criado na próxima etapa
import swaggerDocument from './config/swagger.json'; 

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para JSON
app.use(express.json());

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/pets', petRoutes);

// Documentação Swagger (será configurada completamente depois)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Rota de health check
app.get('/', (req, res) => {
    res.send('Pet Shop API is running!');
});

let server: any;

if (process.env.NODE_ENV !== 'test') {
    AppDataSource.initialize()
        .then(() => {
            console.log("Data Source inicializado!");
            server = app.listen(PORT, () => {
                console.log(`Servidor rodando na porta ${PORT}`);
                console.log(`Documentação Swagger em http://localhost:${PORT}/api-docs`);
            });
        })
        .catch((error) => console.log("Erro ao inicializar Data Source:", error));
}

export { app, server };
