import prisma from '../../config/database.js';
import { toZonedTime, startOfDay, endOfDay } from '../../utils/time.js';

export async function getToday(userId, dateFilter) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const err = new Error('User not found.');
    err.status = 404;
    throw err;
  }

  // Active goal = latest by startDate
  const goal = await prisma.goal.findFirst({
    where: { userId },
    orderBy: { startDate: 'desc' },
  });

  const tz = user.timezone || 'Asia/Ho_Chi_Minh';

  let start, end, date;
  if (dateFilter && /^\d{4}-\d{2}-\d{2}$/.test(dateFilter)) {
    // Use provided date
    const day = new Date(`${dateFilter}T00:00:00+07:00`);
    const zoned = toZonedTime(day, tz);
    start = startOfDay(zoned, tz);
    end = endOfDay(zoned, tz);
    date = dateFilter;
  } else {
    // Default to today
    const zoned = toZonedTime(new Date(), tz);
    start = startOfDay(zoned, tz);
    end = endOfDay(zoned, tz);
    date = zoned.toISOString().split('T')[0];
  }

  // Fetch all meals for the selected date with full details
  const mealRows = await prisma.meal.findMany({
    where: {
      userId,
      eatenAt: { gte: start, lte: end },
    },
    select: {
      id: true,
      description: true,
      eatenAt: true,
      totalCalories: true,
      totalProteinG: true,
      totalCarbsG: true,
      totalFatG: true,
      totalFiberG: true,
      items: {
        select: {
          id: true,
          foodName: true,
          portionG: true,
          calories: true,
          proteinG: true,
          carbsG: true,
          fatG: true,
          fiberG: true,
        },
      },
    },
    orderBy: { eatenAt: 'asc' },
  });

  const consumed = mealRows.reduce(
    (acc, m) => ({
      calories: acc.calories + (m.totalCalories || 0),
      proteinG: acc.proteinG + (m.totalProteinG || 0),
      carbsG: acc.carbsG + (m.totalCarbsG || 0),
      fatG: acc.fatG + (m.totalFatG || 0),
      fiberG: acc.fiberG + (m.totalFiberG || 0),
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 }
  );

  const goalTargets = goal
    ? {
        calories: goal.dailyCalories,
        proteinG: goal.dailyProteinG,
        carbsG: goal.dailyCarbsG,
        fatG: goal.dailyFatG,
        fiberG: goal.dailyFiberG,
      }
    : null;

  const remaining = goalTargets
    ? {
        calories: Math.max(goalTargets.calories - consumed.calories, 0),
        proteinG: Math.max(goalTargets.proteinG - consumed.proteinG, 0),
        carbsG: Math.max(goalTargets.carbsG - consumed.carbsG, 0),
        fatG: Math.max(goalTargets.fatG - consumed.fatG, 0),
        fiberG: Math.max(goalTargets.fiberG - consumed.fiberG, 0),
      }
    : null;

  // Shape meals for the frontend
  const meals = mealRows.map((m) => ({
    id: m.id,
    description: m.description,
    eatenAt: m.eatenAt,
    calories: m.totalCalories,
    proteinG: m.totalProteinG,
    carbsG: m.totalCarbsG,
    fatG: m.totalFatG,
    fiberG: m.totalFiberG,
    items: m.items,
  }));

  return { date, goal: goalTargets, consumed, remaining, meals };
}

function todayRange(timezone) {
  const now = new Date();
  const zoned = toZonedTime(now, timezone);
  return { start: startOfDay(zoned, timezone), end: endOfDay(zoned, timezone) };
}
