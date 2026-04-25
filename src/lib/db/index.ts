import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

// Глобальный синглтон для dev-режима:
// Next.js HMR пересоздаёт модули, но глобальная переменная сохраняется,
// что предотвращает "too many clients already" при разработке.
declare global {
  var __pgClient: postgres.Sql | undefined;
}

const isVercel = Boolean(process.env.VERCEL);

const queryClient =
  global.__pgClient ??
  postgres(connectionString, {
    max: isVercel ? 5 : 10, // Vercel serverless — меньший пул
    idle_timeout: 30,
    connect_timeout: 10,
    ssl: isVercel ? "require" : false, // Neon требует SSL
  });

if (process.env.NODE_ENV !== "production") {
  global.__pgClient = queryClient;
}

export const db = drizzle(queryClient, { schema });

export type Database = typeof db;
