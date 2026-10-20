import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getCurrentUser } from "@/lib/server/auth";
import { caseUploadDirectory } from "@/lib/server/case-files";
import { getDb } from "@/lib/server/db";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "请先登录" }, { status: 401 });
  const { id } = await params;
  const file = getDb().prepare("SELECT original_name, stored_name, mime_type FROM case_files WHERE id = ? AND owner_id = ?").get(id, user.id);
  if (!file) return Response.json({ error: "未找到文件" }, { status: 404 });
  try {
    const bytes = await readFile(join(caseUploadDirectory(), user.id, String(file.stored_name)));
    return new Response(bytes, { headers: { "Content-Type": String(file.mime_type), "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(String(file.original_name))}` } });
  } catch {
    return Response.json({ error: "文件存储记录存在，但原始文件不可用" }, { status: 404 });
  }
}
