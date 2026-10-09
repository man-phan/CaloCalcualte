import { z } from 'zod';

const mealItemSchema = z.object({
  foodName: z.string().min(1),
  portionG: z.number().nonnegative(),
  calories: z.number().nonnegative(),
  proteinG: z.number().nonnegative(),
  carbsG: z.number().nonnegative(),
  fatG: z.number().nonnegative(),
  fiberG: z.number().nonnegative(),
});

export const createMealSchema = z.object({
  description: z.string().optional(),
  eatenAt: z.string().datetime({ offset: true }).optional().refine(
    (val) => {
      if (!val) return true;
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      return new Date(val) <= endOfToday;
    },
    { message: 'Cannot paste to a future date.' }
  ),
  items: z.array(mealItemSchema).min(1, 'At least one food item is required.'),
});
