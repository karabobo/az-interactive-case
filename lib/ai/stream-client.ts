/**
 * 浏览器端读取 /api/extract 的纯文本流式响应（服务端已用 openai SDK 把上游SSE
 * 解析成delta并转发为纯文本，这里只需要逐块解码拼接，不用再自己解析SSE格式）。
 */
export async function streamExtraction(
  params: {
    rawText: string;
    scenario: string | null;
    audience: string | null;
    diseaseType: string | null;
    product: string | null;
    modelId: string;
  },
  onDelta: (fullTextSoFar: string) => void
): Promise<string> {
  const res = await fetch("/api/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok || !res.body) {
    let message = `请求失败（${res.status}）`;
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      // ignore parse failure, keep default message
    }
    throw new Error(message);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    full += decoder.decode(value, { stream: true });
    onDelta(full);
  }

  return full;
}

export async function streamInteractiveStory(
  params: Record<string, unknown>,
  onDelta: (fullTextSoFar: string) => void
): Promise<string> {
  const res = await fetch("/api/story", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok || !res.body) {
    let message = `请求失败（${res.status}）`;
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      // 保留默认错误信息。
    }
    throw new Error(message);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    full += decoder.decode(value, { stream: true });
    onDelta(full);
  }
  return full;
}

/**
 * 模型偶尔会遗漏逗号或用代码块包裹 JSON。先按原文解析，失败时仅修复 JSON
 * 语法，不增加、删除或改写任何模型生成的医学内容。
 */
export function parseModelJson<T>(text: string): T {
  const stripped = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  try {
    return JSON.parse(stripped) as T;
  } catch (originalError) {
    try {
      return JSON.parse(jsonrepair(stripped)) as T;
    } catch {
      throw originalError;
    }
  }
}
import { jsonrepair } from "jsonrepair";
