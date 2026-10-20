import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getDb } from "@/lib/server/db";

const SESSION_COOKIE = "az_case_session";
const SESSION_DAYS = 30;

export type SessionUser = { id: string; username: string; role: "user" | "admin" };

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function passwordHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

function passwordMatches(password: string, stored: string) {
  const [salt, expected] = stored.split(":");
  if (!salt || !expected) return false;
  const actual = scryptSync(password, salt, 64).toString("hex");
  return timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(expected, "hex"));
}

export function normalizeUsername(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function validateCredentials(username: string, password: unknown) {
  if (username.length < 3 || username.length > 32) return "账号需为 3–32 个字符";
  if (!/^[\p{L}\p{N}_.-]+$/u.test(username)) return "账号仅支持中文、字母、数字、下划线、连字符和点号";
  if (typeof password !== "string" || password.length < 8) return "密码至少需要 8 位";
  return null;
}

export function registerUser(username: string, password: string): SessionUser | null {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  try {
    db.prepare("INSERT INTO users (id, username, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)")
      .run(id, username, passwordHash(password), username.toLowerCase() === "admin" ? "admin" : "user", now);
    return { id, username, role: username.toLowerCase() === "admin" ? "admin" : "user" };
  } catch {
    return null;
  }
}

export function authenticateUser(username: string, password: string): SessionUser | null {
  const row = getDb().prepare("SELECT id, username, password_hash, role FROM users WHERE username = ?").get(username);
  if (!row || typeof row.password_hash !== "string" || !passwordMatches(password, row.password_hash)) return null;
  return { id: String(row.id), username: String(row.username), role: row.role === "admin" ? "admin" : "user" };
}

export function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  getDb().prepare("INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)")
    .run(hashToken(token), userId, expires.toISOString(), new Date().toISOString());
  return { token, expires };
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = getDb().prepare(`SELECT u.id, u.username, u.role FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?`).get(hashToken(token), new Date().toISOString());
  if (!row) return null;
  return { id: String(row.id), username: String(row.username), role: row.role === "admin" ? "admin" : "user" };
}

export function setSessionCookie(response: Response, session: { token: string; expires: Date }) {
  const secure = process.env.FORCE_HTTPS === "true";
  response.headers.append("Set-Cookie", `${SESSION_COOKIE}=${session.token}; Path=/; HttpOnly; SameSite=Lax; Expires=${session.expires.toUTCString()}${secure ? "; Secure" : ""}`);
}

export function clearSessionCookie(response: Response) {
  response.headers.append("Set-Cookie", `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

export async function removeCurrentSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token) getDb().prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
}
