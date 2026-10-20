import { buildExtractionSystemPrompt } from "@/lib/ai/prompts";
import { resolveBackendModelId } from "@/lib/ai/model-catalog";
import { getCurrentUser } from "@/lib/server/auth";

/**
 * MiniMax /v1/responses（OpenAI Responses API兼容）。Node原生fetch对这个host
 * 连接正常（不像teamorouter那个host会把Node的TLS握手直接RST），不需要curl子进程绕过。
 * 流式事件格式：event: response.output_text.delta + data:{"delta":"..."}，
 * 这里只把delta纯文本转发给浏览器，浏览器端不用关心SSE细节。
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "请先登录" }, { status: 401 });
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "服务端未配置 MINIMAX_API_KEY，请先在 .env.local 中设置" },
      { status: 500 }
    );
  }

  const body = await request.json();
  const { rawText, scenario, audience, diseaseType, product, modelId } = body as {
    rawText: string;
    scenario: string | null;
    audience: string | null;
    diseaseType: string | null;
    product: string | null;
    modelId: string;
  };

  if (!rawText || !rawText.trim()) {
    return Response.json({ error: "缺少病例原文，无法提取" }, { status: 400 });
  }

  const instructions = buildExtractionSystemPrompt({
    scenario: scenario as never,
    audience,
    diseaseType: diseaseType as never,
    product,
  });

  const upstream = await fetch("https://api.minimax.cn/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: resolveBackendModelId(modelId),
      instructions,
      input: [{ role: "user", content: rawText }],
      stream: true,
      reasoning: { effort: "none" },
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => "");
    return Response.json(
      { error: `模型调用失败（${upstream.status}）：${text.slice(0, 300)}` },
      { status: 502 }
    );
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const reader = upstream.body.getReader();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const data = trimmed.slice(5).trim();
            if (!data) continue;
            try {
              const json = JSON.parse(data);
              if (json.type === "response.output_text.delta" && json.delta) {
                controller.enqueue(encoder.encode(json.delta as string));
              } else if (json.type === "response.failed" || json.error) {
                throw new Error(json.error?.message ?? "MiniMax 响应失败");
              }
            } catch {
              // 跨chunk被截断的半行，忽略，等下一轮拼接完整后再解析
            }
          }
        }
        controller.close();
      } catch (e) {
        controller.error(e);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
