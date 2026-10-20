/**
 * 客户端真实解析 .docx 文本——用真实上传内容替代固定 mock，
 * 让"提取信息"步骤至少基于真实读到的原文（AI理解本身仍是mock，见 lib/ai/mock-pipeline.ts）。
 * 动态 import 浏览器构建，避免把 mammoth 的 Node 依赖打进 SSR bundle。
 */
export async function extractDocxRawText(file: File): Promise<string> {
  const mammoth = await import("mammoth/mammoth.browser");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value.trim();
}

export function isDocx(file: File): boolean {
  return (
    file.name.toLowerCase().endsWith(".docx") ||
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
}
