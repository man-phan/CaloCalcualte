import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../config/database.js';
import { env } from '../../config/env.js';

export async function register({ username, password }) {
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    const err = new Error('Username already in use.');
    err.status = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { username, passwordHash },
    select: { id: true, username: true, createdAt: true },
  });

  const token = signToken(user.id);
  return { user, token };
}

export async function login({ username, password }) {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    const err = new Error('Invalid username or password.');
    err.status = 401;
    throw err;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    const err = new Error('Invalid username or password.');
    err.status = 401;
    throw err;
  }

  const token = signToken(user.id);
  return {
    user: {
      id: user.id,
      username: user.username,
      gender: user.gender,
      birthYear: user.birthYear,
      heightCm: user.heightCm,
      weightKg: user.weightKg,
      activityLevel: user.activityLevel,
      timezone: user.timezone,
      createdAt: user.createdAt,
    },
    token,
  };
}

export async function getMe(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      gender: true,
      birthYear: true,
      heightCm: true,
      weightKg: true,
      activityLevel: true,
      timezone: true,
      createdAt: true,
    },
  });

  if (!user) {
    const err = new Error('User not found.');
    err.status = 404;
    throw err;
  }

  return user;
}

function signToken(userId) {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}
