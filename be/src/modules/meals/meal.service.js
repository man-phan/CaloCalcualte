import prisma from '../../config/database.js';
import { toZonedTime, startOfDay, endOfDay } from '../../utils/time.js';

// ─── Save Meal ────────────────────────────────────────────────────────────────

export async function createMeal(userId, { description, eatenAt, items }) {
  // BE calculates totals — never trust client totals
  const totals = items.reduce(
    (acc, item) => ({
      totalCalories: acc.totalCalories + item.calories,
      totalProteinG: acc.totalProteinG + item.proteinG,
      totalCarbsG: acc.totalCarbsG + item.carbsG,
      totalFatG: acc.totalFatG + item.fatG,
      totalFiberG: acc.totalFiberG + item.fiberG,
    }),
    { totalCalories: 0, totalProteinG: 0, totalCarbsG: 0, totalFatG: 0, totalFiberG: 0 }
  );

  return prisma.$transaction(async (tx) => {
    const meal = await tx.meal.create({
      data: {
        userId,
        description,
        eatenAt: eatenAt ? new Date(eatenAt) : new Date(),
        aiModel: 'gemini-1.5-flash',
        ...totals,
        items: {
          create: items.map((item) => ({
            foodName: item.foodName,
            portionG: item.portionG,
            calories: item.calories,
            proteinG: item.proteinG,
            carbsG: item.carbsG,
            fatG: item.fatG,
            fiberG: item.fiberG,
          })),
        },
      },
      include: { items: true },
    });
    return meal;
  });
}

// ─── Get Meals ────────────────────────────────────────────────────────────────

export async function getMeals(userId, dateFilter) {
  let where = { userId };

  if (dateFilter) {
    // dateFilter = 'YYYY-MM-DD', filter in Asia/Ho_Chi_Minh
    const tz = 'Asia/Ho_Chi_Minh';
    const day = new Date(`${dateFilter}T00:00:00+07:00`);
    const { start, end } = { start: startOfDay(day, tz), end: endOfDay(day, tz) };
    where.eatenAt = { gte: start, lte: end };
  }

  return prisma.meal.findMany({
    where,
    include: { items: true },
    orderBy: { eatenAt: 'desc' },
  });
}

// ─── Get Meal by ID ───────────────────────────────────────────────────────────

export async function getMealById(userId, mealId) {
  const meal = await prisma.meal.findFirst({
    where: { id: mealId, userId },
    include: { items: true },
  });

  if (!meal) {
    const err = new Error('Meal not found.');
    err.status = 404;
    throw err;
  }

  return meal;
}

// ─── Delete Meal ──────────────────────────────────────────────────────────────

export async function deleteMeal(userId, mealId) {
  const meal = await prisma.meal.findFirst({ where: { id: mealId, userId } });
  if (!meal) {
    const err = new Error('Meal not found.');
    err.status = 404;
    throw err;
  }

  await prisma.meal.delete({ where: { id: mealId } });
}
