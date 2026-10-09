import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import * as goalController from './goal.controller.js';

const router = Router();
router.use(authMiddleware);

router.get('/active', goalController.getActiveGoal);
router.post('/', goalController.createGoal);


export default router;
