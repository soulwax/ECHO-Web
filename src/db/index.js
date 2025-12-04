// File: src/db/index.ts
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
const sqlite = new Database(process.env.DATABASE_URL || './data/db.sqlite');
// Enable foreign keys
sqlite.pragma('foreign_keys = ON');
export const db = drizzle(sqlite, { schema });
