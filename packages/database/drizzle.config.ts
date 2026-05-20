import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env['DATABASE_URL'] ?? 'postgresql://haritailesi:2562803%2CSeco.@localhost:5432/haritailesi',
  },
  verbose: true,
  strict: true,
});
