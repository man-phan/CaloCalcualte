import prisma from '../../config/database.js';
import { calculateNutritionTarget } from '../goals/goal.calculator.js';

const SELECT_PROFILE = {
  id: true,
  username: true,
  gender: true,
  birthYear: true,
  heightCm: true,
  weightKg: true,
  activityLevel: true,
  timezone: true,
  createdAt: true,
  updatedAt: true,
};

export async function getProfile(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: SELECT_PROFILE });
  if (!user) {
    const err = new Error('User not found.');
    err.status = 404;
    throw err;
  }
  return user;
}

export async function updateProfile(userId, data) {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data,
    select: SELECT_PROFILE,
  });

  // Recalculate active goal nutrition targets if all required fields are present
  const activeGoal = await prisma.goal.findFirst({
    where: { userId },
    orderBy: { startDate: 'desc' },
  });

  if (activeGoal) {
    const requiredFields = ['gender', 'birthYear', 'heightCm', 'weightKg', 'activityLevel'];
    const hasAllFields = requiredFields.every((f) => updatedUser[f] != null);
    if (hasAllFields) {
      const targets = calculateNutritionTarget(updatedUser, activeGoal.lossKgPerMonth);
      await prisma.goal.update({
        where: { id: activeGoal.id },
        data: {
          dailyCalories: targets.dailyCalories,
          dailyProteinG: targets.dailyProteinG,
          dailyCarbsG: targets.dailyCarbsG,
          dailyFatG: targets.dailyFatG,
          dailyFiberG: targets.dailyFiberG,
        },
      });
    }
  }

  return updatedUser;
}

export async function updateMetrics(userId, data) {
  // 1. Update user height and/or weight
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data,
    select: SELECT_PROFILE,
  });

  // 2. Find the active goal
  const activeGoal = await prisma.goal.findFirst({
    where: { userId },
    orderBy: { startDate: 'desc' },
  });

  if (!activeGoal) {
    return { user: updatedUser, goal: null, calculation: null };
  }

  // 3. Check all required profile fields are present to recalculate
  const requiredFields = ['gender', 'birthYear', 'heightCm', 'weightKg', 'activityLevel'];
  const hasAllFields = requiredFields.every((f) => updatedUser[f] != null);

  if (!hasAllFields) {
    return { user: updatedUser, goal: activeGoal, calculation: null };
  }

  // 4. Recalculate nutrition targets with updated metrics
  const targets = calculateNutritionTarget(updatedUser, activeGoal.lossKgPerMonth);

  // 5. Update active goal with recalculated figures
  const updatedGoal = await prisma.goal.update({
    where: { id: activeGoal.id },
    data: {
      dailyCalories: targets.dailyCalories,
      dailyProteinG: targets.dailyProteinG,
      dailyCarbsG: targets.dailyCarbsG,
      dailyFatG: targets.dailyFatG,
      dailyFiberG: targets.dailyFiberG,
    },
  });

  return {
    user: updatedUser,
    goal: updatedGoal,
    calculation: {
      bmr: targets.bmr,
      tdee: targets.tdee,
      goalStatus: targets.goalStatus,
      warning: targets.warning,
    },
  };
}
