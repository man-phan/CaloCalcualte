import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import * as dashboardController from './dashboard.controller.js';

const router = Router();
router.use(authMiddleware);

router.get('/today', dashboardController.getToday);

export default router;
