import { z } from 'zod';

const ingredientSchema = z.object({
  name: z.string().min(1),
  estimated_grams: z.number().nonnegative(),
  calories: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fat: z.number().nonnegative(),
  fiber: z.number().nonnegative(),
});

const totalSchema = z.object({
  calories: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fat: z.number().nonnegative(),
  fiber: z.number().nonnegative(),
});

export const aiAnalysisSchema = z.object({
  food_name: z.string().min(1),
  ingredients: z.array(ingredientSchema).min(1, 'AI returned no food items.'),
  total: totalSchema,
  confidence: z.number().min(0).max(1),
});
