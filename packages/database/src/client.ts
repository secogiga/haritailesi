import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export type Database = ReturnType<typeof createDatabase>;

export function createDatabase(connectionString: string) {
  const queryClient = postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    connection: {
      client_encoding: 'UTF8',
    },
  });

  return drizzle(queryClient, { schema, logger: process.env['NODE_ENV'] === 'development' });
}
