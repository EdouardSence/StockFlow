import Database from 'better-sqlite3';
import { Kysely, SqliteDialect } from 'kysely';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Database as DB } from './types';

const sqlite = new Database(join(process.cwd(), 'stockflow.db'));
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

const migration = readFileSync(
  join(import.meta.dirname, 'migrations/001_init.sql'),
  'utf-8'
);
sqlite.exec(migration);

export const db = new Kysely<DB>({
  dialect: new SqliteDialect({ database: sqlite }),
});
