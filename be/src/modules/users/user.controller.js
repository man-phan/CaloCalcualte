import { updateProfileSchema, updateMetricsSchema } from './user.schema.js';
import * as userService from './user.service.js';

export async function getProfile(req, res, next) {
  try {
    const profile = await userService.getProfile(req.userId);
    res.json(profile);
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const data = updateProfileSchema.parse(req.body);
    const profile = await userService.updateProfile(req.userId, data);
    res.json(profile);
  } catch (err) {
    next(err);
  }
}

export async function updateMetrics(req, res, next) {
  try {
    const data = updateMetricsSchema.parse(req.body);
    const result = await userService.updateMetrics(req.userId, data);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
