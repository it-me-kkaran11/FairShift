import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import * as fs from 'node:fs';
import { SCHEMA_SQL } from './schema.ts';

let dbInstance: DatabaseSync | null = null;

export function getDbPath(): string {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, 'fairshift.db');
}

export function getDb(): DatabaseSync {
  if (!dbInstance) {
    const dbPath = getDbPath();
    dbInstance = new DatabaseSync(dbPath);
    // Enable WAL mode & foreign keys
    dbInstance.exec('PRAGMA journal_mode = WAL;');
    dbInstance.exec('PRAGMA foreign_keys = ON;');
    // Initialize schema
    dbInstance.exec(SCHEMA_SQL);
  }
  return dbInstance;
}

export function queryAll<T = any>(sql: string, params: any[] = []): T[] {
  const db = getDb();
  const stmt = db.prepare(sql);
  return stmt.all(...params) as T[];
}

export function queryOne<T = any>(sql: string, params: any[] = []): T | null {
  const db = getDb();
  const stmt = db.prepare(sql);
  const result = stmt.get(...params);
  return (result as T) || null;
}

export function execute(sql: string, params: any[] = []): { changes: number | bigint; lastInsertRowid: number | bigint } {
  const db = getDb();
  const stmt = db.prepare(sql);
  const info = stmt.run(...params);
  return {
    changes: info.changes,
    lastInsertRowid: info.lastInsertRowid,
  };
}

export function executeBatch(statements: string[]): void {
  const db = getDb();
  for (const sql of statements) {
    if (sql.trim()) {
      db.exec(sql);
    }
  }
}

export function resetDatabase(): void {
  const db = getDb();
  // Drop all tables
  const tables = [
    'fairness_receipts',
    'skill_credentials',
    'fairness_ledger',
    'corrective_actions',
    'case_messages',
    'cases',
    'fairness_alerts',
    'payslips',
    'work_records',
    'attendance_events',
    'shift_assignments',
    'users',
    'sites',
    'organisations'
  ];
  for (const table of tables) {
    db.exec(`DROP TABLE IF EXISTS ${table};`);
  }
  // Re-run schema
  db.exec(SCHEMA_SQL);
}
