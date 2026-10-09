import { z } from 'zod';

export const updateProfileSchema = z.object({
  gender: z.enum(['MALE', 'FEMALE']).optional(),
  birthYear: z
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() - 10)
    .optional(),
  heightCm: z.number().positive().max(300).optional(),
  weightKg: z.number().positive().max(500).optional(),
  activityLevel: z
    .enum(['LOW', 'LIGHT', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE'])
    .optional(),
  timezone: z.string().optional(),
});

export const updateMetricsSchema = z
  .object({
    heightCm: z.number().positive().max(300).optional(),
    weightKg: z.number().positive().max(500).optional(),
    gender: z.enum(['MALE', 'FEMALE']).optional(),
    birthYear: z
      .number()
      .int()
      .min(1900)
      .max(new Date().getFullYear() - 10)
      .optional(),
    activityLevel: z
      .enum(['LOW', 'LIGHT', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE'])
      .optional(),
  })
  .refine((data) => data.heightCm != null || data.weightKg != null, {
    message: 'At least one of heightCm or weightKg must be provided.',
  });

