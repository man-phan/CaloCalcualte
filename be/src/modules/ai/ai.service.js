import { GoogleGenerativeAI } from '@google/generative-ai';
import sharp from 'sharp';
import { env } from '../../config/env.js';
import { buildMealAnalysisPrompt } from './ai.prompt.js';
import { aiAnalysisSchema } from './ai.schema.js';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

const wait = (ms) => new Promise((res) => setTimeout(res, ms));

/**
 * Analyze meal from optional image buffer + optional text description.
 * Returns validated analysis object: { food_name, ingredients, total, confidence }.
 */
export async function analyzeMeal({ imageBuffer, mimeType, description }) {
  if (!imageBuffer && !description) {
    const err = new Error('Provide an image, a description, or both.');
    err.status = 400;
    throw err;
  }

  const MODELS = [
    'gemini-3.8-flash',
    'gemini-3.7-flash',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-2.5-flash',
  ];

  const prompt = buildMealAnalysisPrompt(description);
  const parts = [{ text: prompt }];

  if (imageBuffer) {
    const optimised = await sharp(imageBuffer)
      .resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    parts.push({
      inlineData: {
        data: optimised.toString('base64'),
        mimeType: 'image/webp',
      },
    });
  }

  let rawText;
  const maxRetries = 3;
  let lastErr;

  for (const modelName of MODELS) {
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: { responseMimeType: 'application/json' },
    });

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await model.generateContent(parts);
        rawText = result.response.text();
        break;
      } catch (geminiErr) {
        lastErr = geminiErr;
        const is503 = geminiErr.status === 503 ||
          geminiErr.message?.includes('high demand') ||
          geminiErr.message?.includes('Service Unavailable');
        if (!is503 || attempt === maxRetries - 1) break;
        await wait(1000 * Math.pow(2, attempt));
      }
    }

    if (rawText) break; // got a response — stop trying models
  }

  if (!rawText) {
    const err = new Error('AI analysis failed. Please try again.');
    err.status = 502;
    err.cause = lastErr;
    throw err;
  }

  // Strip possible markdown code fences (safety net even with responseMimeType)
  const cleaned = rawText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const err = new Error('AI returned invalid JSON. Please try again.');
    err.status = 502;
    throw err;
  }

  const validated = aiAnalysisSchema.safeParse(parsed);
  if (!validated.success) {
    const err = new Error('AI response did not match expected format.');
    err.status = 502;
    throw err;
  }

  return validated.data;
}
