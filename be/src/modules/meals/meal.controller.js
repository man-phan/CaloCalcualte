import { analyzeMeal } from '../ai/ai.service.js';
import { createMealSchema } from './meal.schema.js';
import * as mealService from './meal.service.js';

// POST /api/meals/analyze
export async function analyze(req, res, next) {
  try {
    const file = req.file;
    const description = req.body.description?.trim() || null;

    if (!file && !description) {
      return res.status(400).json({ error: 'Provide an image, a description, or both.' });
    }

    const analysis = await analyzeMeal({
      imageBuffer: file?.buffer ?? null,
      mimeType: file?.mimetype ?? null,
      description,
    });

    // Recalculate totals on backend to guarantee accuracy
    const total = analysis.ingredients.reduce(
      (acc, ing) => ({
        calories: +(acc.calories + ing.calories).toFixed(2),
        protein: +(acc.protein + ing.protein).toFixed(2),
        carbs: +(acc.carbs + ing.carbs).toFixed(2),
        fat: +(acc.fat + ing.fat).toFixed(2),
        fiber: +(acc.fiber + ing.fiber).toFixed(2),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    );

    res.json({
      food_name: analysis.food_name,
      ingredients: analysis.ingredients,
      total,
      confidence: analysis.confidence,
    });
  } catch (err) {
    next(err);
  }
}


// POST /api/meals
export async function createMeal(req, res, next) {
  try {
    const data = createMealSchema.parse(req.body);
    const meal = await mealService.createMeal(req.userId, data);
    res.status(201).json(meal);
  } catch (err) {
    next(err);
  }
}

// GET /api/meals
export async function getMeals(req, res, next) {
  try {
    const date = req.query.date || null;
    const meals = await mealService.getMeals(req.userId, date);
    res.json(meals);
  } catch (err) {
    next(err);
  }
}

// GET /api/meals/:id
export async function getMealById(req, res, next) {
  try {
    const meal = await mealService.getMealById(req.userId, req.params.id);
    res.json(meal);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/meals/:id
export async function deleteMeal(req, res, next) {
  try {
    await mealService.deleteMeal(req.userId, req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
