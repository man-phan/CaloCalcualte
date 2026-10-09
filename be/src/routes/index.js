import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import userRoutes from '../modules/users/user.routes.js';
import goalRoutes from '../modules/goals/goal.routes.js';
import dashboardRoutes from '../modules/dashboard/dashboard.routes.js';
import mealRoutes from '../modules/meals/meal.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/goals', goalRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/meals', mealRoutes);

export default router;
