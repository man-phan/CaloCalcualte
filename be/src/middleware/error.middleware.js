import { env } from '../config/env.js';

// eslint-disable-next-line no-unused-vars
export function errorMiddleware(err, req, res, next) {
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
    });
  }

  if (err.name === 'MulterError') {
    return res.status(400).json({ error: err.message });
  }

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  if (env.NODE_ENV === 'development') {
    console.error(err);
  }

  return res.status(status).json({ error: message });
}
