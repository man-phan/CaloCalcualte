import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import * as userController from './user.controller.js';

const router = Router();
router.use(authMiddleware);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.patch('/metrics', userController.updateMetrics);

export default router;
