import { getCurrentUser } from "@/lib/server/auth";
import { storeAndParseCaseFile } from "@/lib/server/case-files";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "请先登录" }, { status: 401 });
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return Response.json({ error: "请选择病例文件" }, { status: 400 });
    const document = await storeAndParseCaseFile(user.id, file);
    return Response.json({ document });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "文件上传或解析失败" }, { status: 400 });
  }
}
