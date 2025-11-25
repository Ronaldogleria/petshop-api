import { Router } from 'express';
import { PetController } from '../controllers/PetController';
import { authMiddleware } from '../middlewares/Auth';

const router = Router();
const petController = new PetController();

// Todas as rotas de pet requerem autenticação
router.use(authMiddleware);

router.post('/', petController.create);
router.get('/', petController.getAll);
router.get('/:id', petController.getById);
router.put('/:id', petController.update);
router.delete('/:id', petController.delete);

export default router;
