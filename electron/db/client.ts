// electron/db/client.ts
// Runs in the Electron MAIN process only.
// Never import this from the renderer — use IPC.

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { app } from 'electron';
import path from 'path';
import * as schema from './schema';

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (_db) return _db;

  // Store the SQLite file in Electron's userData directory
  // macOS: ~/Library/Application Support/Kylo/kylo.db
  // Windows: %APPDATA%/Kylo/kylo.db
  const dbPath = path.join(app.getPath('userData'), 'kylo.db');

  const sqlite = new Database(dbPath);

  // Performance pragmas — makes SQLite dramatically faster
  sqlite.pragma('journal_mode = WAL');     // Write-ahead log: concurrent reads during writes
  sqlite.pragma('synchronous = NORMAL');   // Safe + fast (vs FULL which is slow)
  sqlite.pragma('foreign_keys = ON');
  sqlite.pragma('cache_size = -32000');    // 32MB page cache
  sqlite.pragma('temp_store = MEMORY');

  _db = drizzle(sqlite, { schema });

  // Run migrations on every launch — safe, only applies new ones
  migrate(_db, { migrationsFolder: path.join(__dirname, 'migrations') });

  return _db;
}

export type Db = ReturnType<typeof getDb>;