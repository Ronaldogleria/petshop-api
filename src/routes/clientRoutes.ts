import { Router } from 'express';
import { ClientController } from '../controllers/ClientController';
import { authMiddleware } from '../middlewares/Auth';

const router = Router();
const clientController = new ClientController();

// Todas as rotas de cliente requerem autenticação
router.use(authMiddleware);

router.post('/', clientController.create);
router.get('/', clientController.getAll);
router.get('/:id', clientController.getById);
router.put('/:id', clientController.update);
router.delete('/:id', clientController.delete);

export default router;
