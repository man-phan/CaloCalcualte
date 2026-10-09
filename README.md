# Calo Calculate

A calorie calculation app with a React frontend, Node.js API, and PostgreSQL database.

## Structure

- `fe`: React + Vite frontend
- `nodejs`: Express API and PostgreSQL access
- `docker-compose.yml`: local PostgreSQL service

## Run

1. Start PostgreSQL:

   ```bash
   docker compose up -d postgres
   ```

2. Install dependencies:

   ```bash
   npm install
   npm run install:all
   ```

3. Start the frontend and API:

   ```bash
   npm run dev
   ```

The frontend runs at `http://localhost:5173` and the API at `http://localhost:4000`.
