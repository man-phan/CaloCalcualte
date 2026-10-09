import { describe, it, expect } from 'vitest';
import {
  calculateAge,
  calculateBMR,
  calculateTDEE,
  calculateCalorieDeficit,
  calculateDailyCalories,
  calculateProtein,
  calculateFat,
  calculateCarbs,
  calculateFiber,
  getGoalStatus,
  ACTIVITY_FACTORS,
} from '../../src/modules/goals/goal.calculator.js';

describe('calculateAge', () => {
  it('returns correct age', () => {
    const year = new Date().getFullYear() - 25;
    expect(calculateAge(year)).toBe(25);
  });
});

describe('calculateBMR', () => {
  const base = { heightCm: 170, weightKg: 70, birthYear: new Date().getFullYear() - 30 };
  it('MALE: 10*70 + 6.25*170 - 5*30 + 5 = 1617.5', () => {
    expect(calculateBMR({ ...base, gender: 'MALE' })).toBeCloseTo(1617.5, 0);
  });
  it('FEMALE: 1617.5 - 166 = 1451.5', () => {
    expect(calculateBMR({ ...base, gender: 'FEMALE' })).toBeCloseTo(1451.5, 0);
  });
});

describe('calculateTDEE', () => {
  it('multiplies BMR by activity factor', () => {
    expect(calculateTDEE(1700, 'MODERATE')).toBeCloseTo(1700 * 1.55, 1);
  });
});

describe('ACTIVITY_FACTORS', () => {
  it('has all 5 levels with correct values', () => {
    expect(ACTIVITY_FACTORS.LOW).toBe(1.2);
    expect(ACTIVITY_FACTORS.LIGHT).toBe(1.375);
    expect(ACTIVITY_FACTORS.MODERATE).toBe(1.55);
    expect(ACTIVITY_FACTORS.ACTIVE).toBe(1.725);
    expect(ACTIVITY_FACTORS.VERY_ACTIVE).toBe(1.9);
  });
});

describe('calculateCalorieDeficit', () => {
  it('0.5 kg/month → ~128.33 kcal/day deficit', () => {
    expect(calculateCalorieDeficit(0.5)).toBeCloseTo((0.5 * 7700) / 30, 1);
  });
});

describe('calculateDailyCalories', () => {
  it('returns clamped value for FEMALE if deficit too large', () => {
    const { dailyCalories, isClamped } = calculateDailyCalories({
      gender: 'FEMALE',
      tdee: 1300,
      lossKgPerMonth: 1.0,
    });
    expect(dailyCalories).toBe(1200);
    expect(isClamped).toBe(true);
  });

  it('returns unclamped value when safe', () => {
    const { dailyCalories, isClamped } = calculateDailyCalories({
      gender: 'MALE',
      tdee: 2500,
      lossKgPerMonth: 0.5,
    });
    expect(isClamped).toBe(false);
    expect(dailyCalories).toBeGreaterThan(1500);
  });
});

describe('calculateProtein', () => {
  it('70 kg → 112 g protein', () => {
    expect(calculateProtein(70)).toBe(112);
  });
});

describe('calculateFat', () => {
  it('2000 kcal → ~56 g fat', () => {
    expect(calculateFat(2000)).toBe(Math.round((2000 * 0.25) / 9));
  });
});

describe('calculateCarbs', () => {
  it('remaining calories go to carbs', () => {
    const carbs = calculateCarbs(2000, 112, 56);
    const used = 112 * 4 + 56 * 9;
    expect(carbs).toBe(Math.round((2000 - used) / 4));
  });
});

describe('calculateFiber', () => {
  it('MALE → 38, FEMALE → 25', () => {
    expect(calculateFiber('MALE')).toBe(38);
    expect(calculateFiber('FEMALE')).toBe(25);
  });
});

describe('getGoalStatus', () => {
  it('0.2 kg → SLOW', () => expect(getGoalStatus(0.2).status).toBe('SLOW'));
  it('0.3 kg → MODERATE', () => expect(getGoalStatus(0.3).status).toBe('MODERATE'));
  it('0.7 kg → MODERATE', () => expect(getGoalStatus(0.7).status).toBe('MODERATE'));
  it('0.8 kg → HIGH', () => expect(getGoalStatus(0.8).status).toBe('HIGH'));
  it('1.0 kg → HIGH', () => expect(getGoalStatus(1.0).status).toBe('HIGH'));
});
