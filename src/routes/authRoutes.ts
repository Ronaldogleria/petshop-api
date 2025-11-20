import { Router } from 'express';
import { AttendantController } from '../controllers/AttendantController';

const router = Router();
const attendantController = new AttendantController();

router.post('/register', attendantController.register);
router.post('/login', attendantController.login);

export default router;
