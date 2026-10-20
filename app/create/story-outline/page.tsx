"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StoryActCard } from "@/components/outline/StoryActCard";
import { useCaseStore } from "@/lib/store/case-store";

export default function StoryOutlinePage() {
  const router = useRouter();
  const {
    fields,
    triggeredDecisionPoints,
    storyActs,
    status,
    errors,
    storyStreamText,
    runStoryOutline,
    selectInteractionAlternative,
  } = useCaseStore();

  if (fields.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 text-sm text-foreground-soft">
        还没有结构化病例数据，请先完成
        <Link href="/create/case-input" className="mx-1 text-brand-600 underline">
          上一步
        </Link>
        的结构化病例生成。
      </div>
    );
  }

  // 剧情已经保存在病例项目内时，可直接继续编辑，不要求再次生成。
  const hasResult = status.story === "success" || storyActs.length > 0;

  return (
    <div id="story-outline" className="scroll-mt-24 flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          互动剧情生成
        </h1>
        <p className="mt-1 text-sm text-foreground-soft">
          将结构化病例与已纳入的互动问题编排为连续的诊疗剧情：场景、人物对话、时间线转场与互动节点。
        </p>
      </div>

      {status.story !== "success" && (
        <div className="rounded-2xl border border-border bg-surface p-5">
          <Button onClick={runStoryOutline} disabled={status.story === "loading"}>
            {status.story === "loading" ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                正在生成互动剧情…
              </>
            ) : (
              "开始生成互动剧情"
            )}
          </Button>

          {status.story === "error" && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-wine-100 bg-wine-100/60 p-3 text-sm text-wine-700">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">生成失败</p>
                <p className="mt-0.5 text-[13px]">{errors.story}</p>
                <button
                  onClick={runStoryOutline}
                  className="mt-2 text-[13px] font-medium underline underline-offset-2"
                >
                  重试
                </button>
              </div>
            </div>
          )}
          {status.story === "loading" && storyStreamText && (
            <pre className="mt-4 max-h-56 overflow-y-auto whitespace-pre-wrap rounded-lg bg-surface-sunken p-3 text-[12px] leading-relaxed text-foreground-soft">
              {storyStreamText}
              <span className="animate-pulse">▍</span>
            </pre>
          )}
        </div>
      )}

      {hasResult && (
        <div className="flex flex-col gap-3">
          {storyActs.map((act) => (
            <StoryActCard
              key={act.id}
              act={act}
              decisionPoints={triggeredDecisionPoints}
              onAlternativeSelect={selectInteractionAlternative}
            />
          ))}
        </div>
      )}

      {hasResult && (
        <div className="flex justify-end">
          <Button onClick={() => router.push("/create/render")}>
            下一步：形象与H5生成
            <ArrowRight size={15} />
          </Button>
        </div>
      )}
    </div>
  );
}
