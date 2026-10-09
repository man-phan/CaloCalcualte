export function buildMealAnalysisPrompt(description) {
  const descPart = description
    ? `The user described the meal as: "${description}".`
    : 'No description provided.';

  return `You are a professional nutritionist AI. Analyze the meal from the image and/or description provided.

${descPart}

Instructions:
- Identify the dish name and every individual ingredient/component in the meal.
- Estimate realistic portion sizes in grams for each ingredient.
- Estimate nutrition values per ingredient based on standard nutritional databases.
- Recalculate and sum totals yourself (do not guess the total).
- Set confidence between 0.0 (uncertain) and 1.0 (very certain).
- All numbers must be non-negative.
- Return ONLY valid JSON in the exact format below. No extra text, no markdown, no explanation.

Required JSON format:
{
  "food_name": "Dish name in Vietnamese or English",
  "ingredients": [
    {
      "name": "Ingredient name in Vietnamese or English",
      "estimated_grams": <number>,
      "calories": <number>,
      "protein": <number>,
      "carbs": <number>,
      "fat": <number>,
      "fiber": <number>
    }
  ],
  "total": {
    "calories": <sum of all ingredient calories>,
    "protein": <sum>,
    "carbs": <sum>,
    "fat": <sum>,
    "fiber": <sum>
  },
  "confidence": <number between 0.0 and 1.0>
}`;
}
