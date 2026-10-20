import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { randomBytes, scryptSync } from "node:crypto";
import { DatabaseSync } from "node:sqlite";

type DbHolder = { db?: DatabaseSync };
const holder = globalThis as typeof globalThis & DbHolder;

export function getDb() {
  if (holder.db) return holder.db;
  const dataDir = process.env.CASE_DATA_DIR ?? join(process.cwd(), "data");
  mkdirSync(dataDir, { recursive: true });
  const db = new DatabaseSync(join(dataDir, "interactive-case.sqlite"));
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS case_projects (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      snapshot_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS case_files (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      original_name TEXT NOT NULL,
      stored_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS case_projects_owner_updated ON case_projects(owner_id, updated_at DESC);
    CREATE INDEX IF NOT EXISTS case_files_owner_created ON case_files(owner_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS sessions_user_expires ON sessions(user_id, expires_at);
  `);
  // 演示环境的初始管理员；仅在尚未创建任何账号时写入一次。
  const userCount = db.prepare("SELECT COUNT(*) AS count FROM users").get();
  if (Number(userCount?.count ?? 0) === 0) {
    const salt = randomBytes(16).toString("hex");
    const passwordHash = `${salt}:${scryptSync("admin", salt, 64).toString("hex")}`;
    db.prepare("INSERT INTO users (id, username, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)")
      .run(crypto.randomUUID(), "admin", passwordHash, "admin", new Date().toISOString());
  }
  holder.db = db;
  return db;
}
