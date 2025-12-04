// File: scripts/migrate.ts

import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';
import * as schema from '../src/db/schema';

const sqlite = new Database(process.env.DATABASE_URL || './data/db.sqlite');
sqlite.pragma('foreign_keys = ON');

const db = drizzle(sqlite, { schema });

async function runMigrations() {
  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('Migrations completed!');
  sqlite.close();
}

runMigrations().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
