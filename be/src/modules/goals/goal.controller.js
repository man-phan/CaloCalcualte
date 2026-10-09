import { createGoalSchema } from './goal.schema.js';
import * as goalService from './goal.service.js';

export async function createGoal(req, res, next) {
  try {
    const { lossKgPerMonth } = createGoalSchema.parse(req.body);
    const result = await goalService.createGoal(req.userId, lossKgPerMonth);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getActiveGoal(req, res, next) {
  try {
    const goal = await goalService.getActiveGoal(req.userId);
    res.json({ goal });
  } catch (err) {
    next(err);
  }
}
