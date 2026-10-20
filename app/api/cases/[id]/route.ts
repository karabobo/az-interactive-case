import { getCurrentUser } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "请先登录" }, { status: 401 });
  const { id } = await params;
  const row = getDb().prepare("SELECT id, name, snapshot_json, updated_at FROM case_projects WHERE id = ? AND owner_id = ?").get(id, user.id);
  if (!row) return Response.json({ error: "未找到该病例项目" }, { status: 404 });
  return Response.json({ project: { id: String(row.id), name: String(row.name), updatedAt: String(row.updated_at), snapshot: JSON.parse(String(row.snapshot_json)) } });
}
