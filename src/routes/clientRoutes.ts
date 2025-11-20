import { Router } from 'express';
import { ClientController } from '../controllers/ClientController';
import { authMiddleware } from '../middlewares/Auth';

const router = Router();
const clientController = new ClientController();

// Todas as rotas de cliente requerem autenticação
router.use(authMiddleware);

router.post('/', clientController.create);
router.get('/', clientController.findAll);
router.get('/:id', clientController.findOne);
router.put('/:id', clientController.update);
router.delete('/:id', clientController.remove);

export default router;
