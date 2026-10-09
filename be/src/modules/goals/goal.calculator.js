// Activity factor map
export const ACTIVITY_FACTORS = {
  LOW: 1.2,
  LIGHT: 1.375,
  MODERATE: 1.55,
  ACTIVE: 1.725,
  VERY_ACTIVE: 1.9,
};

// Safety floor: minimum acceptable daily calories
const MIN_CALORIES_MALE = 1500;
const MIN_CALORIES_FEMALE = 1200;

export function calculateAge(birthYear) {
  return new Date().getFullYear() - birthYear;
}

export function calculateBMR({ gender, weightKg, heightCm, birthYear }) {
  const age = calculateAge(birthYear);
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === 'MALE' ? base + 5 : base - 161;
}

export function calculateTDEE(bmr, activityLevel) {
  return bmr * ACTIVITY_FACTORS[activityLevel];
}

export function calculateCalorieDeficit(lossKgPerMonth) {
  const monthlyDeficit = lossKgPerMonth * 7700;
  return monthlyDeficit / 30;
}

export function calculateDailyCalories({ gender, tdee, lossKgPerMonth }) {
  const deficit = calculateCalorieDeficit(lossKgPerMonth);
  const floor = gender === 'MALE' ? MIN_CALORIES_MALE : MIN_CALORIES_FEMALE;
  const raw = tdee - deficit;
  return { dailyCalories: Math.max(Math.round(raw), floor), isClamped: raw < floor };
}

export function calculateProtein(weightKg) {
  // 1.6 g per kg bodyweight
  return Math.round(weightKg * 1.6);
}

export function calculateFat(dailyCalories) {
  // 25% of calories from fat; 1 g fat = 9 kcal
  return Math.round((dailyCalories * 0.25) / 9);
}

export function calculateCarbs(dailyCalories, proteinG, fatG) {
  // Remaining calories after protein + fat filled by carbs; 1 g carb = 4 kcal, 1 g protein = 4 kcal
  const proteinCal = proteinG * 4;
  const fatCal = fatG * 9;
  const remaining = dailyCalories - proteinCal - fatCal;
  return Math.max(Math.round(remaining / 4), 0);
}

export function calculateFiber(gender) {
  // General dietary guidelines
  return gender === 'MALE' ? 38 : 25;
}

export function getGoalStatus(lossKgPerMonth) {
  if (lossKgPerMonth <= 0.2) {
    return {
      status: 'SLOW',
      title: 'Giảm chậm',
      message:
        'Mức giảm này khá nhẹ. Bạn có thể cần nhiều thời gian hơn để đạt mục tiêu, điều này đôi khi ảnh hưởng đến động lực.',
    };
  }
  if (lossKgPerMonth <= 0.7) {
    return {
      status: 'MODERATE',
      title: 'Mức giảm hợp lý',
      message: 'Đây là mức giảm tương đối nhẹ và dễ duy trì đối với nhiều người.',
    };
  }
  return {
    status: 'HIGH',
    title: 'Mức giảm cao',
    message:
      'Mức giảm này khá nhanh. Việc tạo mức thâm hụt lớn có thể khiến bạn mệt mỏi hoặc khó duy trì chế độ ăn. Hãy cân nhắc lựa chọn mức giảm thấp hơn.',
  };
}

/**
 * Main calculation entry point.
 * Returns all nutrition targets + goal status + safety warning if clamped.
 */
export function calculateNutritionTarget(user, lossKgPerMonth) {
  const bmr = calculateBMR(user);
  const tdee = calculateTDEE(bmr, user.activityLevel);
  const { dailyCalories, isClamped } = calculateDailyCalories({
    gender: user.gender,
    tdee,
    lossKgPerMonth,
  });
  const dailyProteinG = calculateProtein(user.weightKg);
  const dailyFatG = calculateFat(dailyCalories);
  const dailyCarbsG = calculateCarbs(dailyCalories, dailyProteinG, dailyFatG);
  const dailyFiberG = calculateFiber(user.gender);
  const goalStatus = getGoalStatus(lossKgPerMonth);

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    dailyCalories,
    dailyProteinG,
    dailyFatG,
    dailyCarbsG,
    dailyFiberG,
    goalStatus,
    warning: isClamped
      ? 'Mức thâm hụt calo quá lớn so với mục tiêu. Chúng tôi đã điều chỉnh lên mức an toàn tối thiểu.'
      : null,
  };
}
