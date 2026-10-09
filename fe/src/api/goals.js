import { apiFetch } from './client.js';

export const goalsApi = {
  createGoal: (lossKgPerMonth) =>
    apiFetch('/goals', {
      method: 'POST',
      body: JSON.stringify({ lossKgPerMonth }),
    }),
  getActiveGoal: () => apiFetch('/goals/active'),
};

