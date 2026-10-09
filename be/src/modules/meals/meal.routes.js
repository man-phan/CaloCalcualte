import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { upload } from '../../middleware/upload.middleware.js';
import * as mealController from './meal.controller.js';

const router = Router();
router.use(authMiddleware);

// AI analysis — optional image upload
router.post('/analyze', upload.single('image'), mealController.analyze);

// Save / history / detail / delete
router.post('/', mealController.createMeal);
router.get('/', mealController.getMeals);
router.get('/:id', mealController.getMealById);
router.delete('/:id', mealController.deleteMeal);

export default router;
