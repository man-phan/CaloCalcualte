import prisma from '../../config/database.js';
import { calculateNutritionTarget } from './goal.calculator.js';

export async function createGoal(userId, lossKgPerMonth) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const err = new Error('User not found.');
    err.status = 404;
    throw err;
  }

  const requiredFields = ['gender', 'birthYear', 'heightCm', 'weightKg', 'activityLevel'];
  const missing = requiredFields.filter((f) => user[f] == null);
  if (missing.length > 0) {
    const err = new Error(`Complete your profile first. Missing: ${missing.join(', ')}`);
    err.status = 400;
    throw err;
  }

  const targets = calculateNutritionTarget(user, lossKgPerMonth);

  const startDate = new Date();
  const goal = await prisma.goal.create({
    data: {
      userId,
      lossKgPerMonth,
      dailyCalories: targets.dailyCalories,
      dailyProteinG: targets.dailyProteinG,
      dailyCarbsG: targets.dailyCarbsG,
      dailyFatG: targets.dailyFatG,
      dailyFiberG: targets.dailyFiberG,
      startDate,
    },
  });

  return {
    goal,
    calculation: {
      bmr: targets.bmr,
      tdee: targets.tdee,
    },
    goalStatus: targets.goalStatus,
    warning: targets.warning,
  };
}

export async function getActiveGoal(userId) {
  return prisma.goal.findFirst({
    where: { userId },
    orderBy: { startDate: 'desc' },
  });
}
