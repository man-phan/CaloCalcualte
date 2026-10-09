const BASE = `${(import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')}/api`;

export async function apiFetch(path, opts = {}) {
  const token = localStorage.getItem('token');
  const headers = { ...(opts.headers || {}) };

  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!(opts.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${BASE}${path}`, { ...opts, headers });

  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('auth:logout'));
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error || body.message || 'Đã xảy ra lỗi');
    err.status = res.status;
    throw err;
  }

  if (res.status === 204) return null;
  return res.json();
}
