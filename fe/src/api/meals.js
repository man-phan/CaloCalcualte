import { apiFetch } from './client.js';

export const mealsApi = {
  analyze: (formData) =>
    apiFetch('/meals/analyze', {
      method: 'POST',
      body: formData,
      // No Content-Type header — browser sets multipart boundary automatically
    }),

  createMeal: (data) =>
    apiFetch('/meals', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMeals: (date) => {
    const qs = date ? `?date=${date}` : '';
    return apiFetch(`/meals${qs}`);
  },

  getMealById: (id) => apiFetch(`/meals/${id}`),

  deleteMeal: (id) =>
    apiFetch(`/meals/${id}`, { method: 'DELETE' }),
};
