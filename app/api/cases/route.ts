import { getCurrentUser } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "请先登录" }, { status: 401 });
  const projects = getDb().prepare("SELECT id, name, created_at, updated_at FROM case_projects WHERE owner_id = ? ORDER BY updated_at DESC").all(user.id)
    .map((row) => ({ id: String(row.id), name: String(row.name), createdAt: String(row.created_at), updatedAt: String(row.updated_at) }));
  return Response.json({ projects });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "请先登录" }, { status: 401 });
  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 80) : "";
  if (!name) return Response.json({ error: "请填写病例项目名称" }, { status: 400 });
  if (!body.snapshot || typeof body.snapshot !== "object") return Response.json({ error: "病例内容无效" }, { status: 400 });
  const id = typeof body.id === "string" && body.id ? body.id : crypto.randomUUID();
  const now = new Date().toISOString();
  const db = getDb();
  const existing = db.prepare("SELECT id FROM case_projects WHERE id = ? AND owner_id = ?").get(id, user.id);
  const snapshot = JSON.stringify(body.snapshot);
  if (existing) db.prepare("UPDATE case_projects SET name = ?, snapshot_json = ?, updated_at = ? WHERE id = ? AND owner_id = ?").run(name, snapshot, now, id, user.id);
  else db.prepare("INSERT INTO case_projects (id, owner_id, name, snapshot_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)").run(id, user.id, name, snapshot, now, now);
  return Response.json({ project: { id, name, updatedAt: now } });
}
