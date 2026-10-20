/**
 * 模型选择器目录。UI上展示 Qwen / Gemini / GPT 三个可选项，均可正常点选；
 * 过渡期这三个在后台都统一路由到 MiniMax 的 MiniMax-M3（同一个接口/模型），
 * 等真实model字符串确定后，只需把对应 backendModelId 换掉，不改UI和调用方。
 */
export interface ModelOption {
  id: string;
  label: string;
  backendModelId: string; // 实际传给 MiniMax /v1/responses 的 model 字段
}

export const MODEL_OPTIONS: ModelOption[] = [
  { id: "qwen", label: "Qwen", backendModelId: "MiniMax-M3" },
  { id: "gemini", label: "Gemini", backendModelId: "MiniMax-M3" },
  { id: "gpt", label: "GPT", backendModelId: "MiniMax-M3" },
];

export const DEFAULT_MODEL_ID = "qwen";

export function resolveBackendModelId(modelId: string): string {
  return (
    MODEL_OPTIONS.find((m) => m.id === modelId)?.backendModelId ?? "MiniMax-M3"
  );
}
