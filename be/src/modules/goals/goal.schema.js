import { z } from 'zod';

export const createGoalSchema = z.object({
  lossKgPerMonth: z
    .number()
    .min(0.1, 'Minimum 0.1 kg/month')
    .max(1.0, 'Maximum 1.0 kg/month'),
});
