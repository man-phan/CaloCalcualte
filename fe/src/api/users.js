import { apiFetch } from './client.js';

export const usersApi = {
  getProfile: () => apiFetch('/users/profile'),

  updateProfile: (data) =>
    apiFetch('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  updateMetrics: (data) =>
    apiFetch('/users/metrics', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};
