import { apiFetch } from './client.js';

export const authApi = {
  register: (username, password) =>
    apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  login: (username, password) =>
    apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  me: () => apiFetch('/auth/me'),
};
