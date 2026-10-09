import { apiFetch } from './client.js';

export const dashboardApi = {
  getToday: (date) => apiFetch(date ? `/dashboard/today?date=${date}` : '/dashboard/today'),
};
