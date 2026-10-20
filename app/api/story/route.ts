import { resolveBackendModelId } from "@/lib/ai/model-catalog";
import { buildInteractiveStoryPrompt } from "@/lib/ai/story-prompt";
import { getCurrentUser } from "@/lib/server/auth";
import type {
  CaseField,
  ClinicalTimelineNode,
  TriggeredDecisionPoint,
} from "@/lib/types/case";

/** 将 MiniMax 的 SSE 输出转成浏览器可直接消费的纯文本流。 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "请先登录" }, { status: 401 });
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "服务端未配置 MINIMAX_API_KEY" }, { status: 500 });
  }

  const body = (await request.json()) as {
    fields: CaseField[];
    timeline: ClinicalTimelineNode[];
    interactionPoints: TriggeredDecisionPoint[];
    modelId: string;
  };
  if (!body.fields?.length) {
    return Response.json({ error: "缺少结构化病例，无法生成互动剧情" }, { status: 400 });
  }

  const upstream = await fetch("https://api.minimax.cn/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: resolveBackendModelId(body.modelId),
      instructions: buildInteractiveStoryPrompt({
        fields: body.fields,
        timeline: body.timeline ?? [],
        interactionPoints: body.interactionPoints ?? [],
      }),
      input: "请开始生成互动剧情。",
      stream: true,
      reasoning: { effort: "none" },
      max_output_tokens: 6000,
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const message = await upstream.text().catch(() => "");
    return Response.json(
      { error: `模型调用失败（${upstream.status}）：${message.slice(0, 300)}` },
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
            const data = line.trim().startsWith("data:")
              ? line.trim().slice(5).trim()
              : "";
            if (!data) continue;
            try {
              const event = JSON.parse(data);
              if (event.type === "response.output_text.delta" && event.delta) {
                controller.enqueue(encoder.encode(event.delta as string));
              }
            } catch {
              // 等待下一个分片补齐被截断的事件。
            }
          }
        }
        controller.close();
      } catch (error) {
        controller.error(error);
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
