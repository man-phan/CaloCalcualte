CREATE TABLE IF NOT EXISTS calorie_profiles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  age INTEGER NOT NULL CHECK (age > 0),
  weight_kg NUMERIC(6, 2) NOT NULL CHECK (weight_kg > 0),
  height_cm NUMERIC(6, 2) NOT NULL CHECK (height_cm > 0),
  activity_level VARCHAR(30) NOT NULL,
  daily_calories INTEGER NOT NULL CHECK (daily_calories > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
