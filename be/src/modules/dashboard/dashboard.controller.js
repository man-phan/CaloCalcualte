import * as dashboardService from './dashboard.service.js';

export async function getToday(req, res, next) {
  try {
    const data = await dashboardService.getToday(req.userId, req.query.date);
    res.json(data);
  } catch (err) {
    next(err);
  }
}
