import { Clapperboard } from "lucide-react";
import { DecisionPointCard } from "@/components/outline/DecisionPointCard";
import type { StoryAct, TriggeredDecisionPoint } from "@/lib/types/case";

function speakerStyle(speaker: string) {
  if (/患者|病人/.test(speaker)) {
    return { side: "justify-end", avatar: "bg-wine-500", label: "患" };
  }
  return { side: "justify-start", avatar: "bg-brand-700", label: "医" };
}

function cleanDialogueLine(line: string) {
  return line
    .trim()
    .replace(/^\*\*(?:医生|患者|病人)\*\*\s*[:：]?\s*/u, "")
    .replace(/^(?:医生|患者|病人)\s*[:：]\s*/u, "");
}

export function StoryActCard({
  act,
  decisionPoints,
  onAlternativeSelect,
}: {
  act: StoryAct;
  decisionPoints: TriggeredDecisionPoint[];
  onAlternativeSelect?: (pointId: string, alternativeId: string) => void;
}) {
  const actPoints = act.decisionPointIds
    .map((id) => decisionPoints.find((p) => p.id === id))
    .filter((p): p is TriggeredDecisionPoint => Boolean(p));

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="border-b border-border-soft bg-gradient-to-r from-brand-50 via-surface to-violet-50 px-5 py-4">
      <h4 className="mb-3 text-sm font-semibold text-foreground">
        {act.title}
      </h4>

      <div className="mb-3 flex items-start gap-2 rounded-lg bg-surface-sunken p-3 text-[13px] text-foreground-soft">
        <Clapperboard size={14} className="mt-0.5 shrink-0 text-foreground-faint" />
        <span>{act.sceneDirection}</span>
      </div>
      </div>

      <div className="px-5 py-4">
        <div className="flex flex-col gap-3">
          {act.dialogue.map((d, i) => {
            // 即使旧版本剧情里残留了 MDT / 家属等角色名，展示端也统一收敛为医患双人对话。
            const displaySpeaker = /患者|病人/.test(d.speaker) ? "患者" : "医生";
            const style = speakerStyle(displaySpeaker);
            return (
          <div key={i} className={`flex ${style.side} gap-2 text-sm`}>
            {style.side === "justify-start" && (
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${style.avatar}`}>
                {style.label}
              </span>
            )}
            <div className={`max-w-[78%] rounded-2xl border border-border-soft px-3 py-2.5 leading-relaxed ${
              style.side === "justify-end" ? "rounded-tr-sm bg-brand-50" : "rounded-tl-sm bg-surface-sunken"
            }`}>
              <span className="mb-0.5 block text-[11px] font-medium text-foreground-faint">
                {displaySpeaker}
              </span>
              <span className="text-foreground">{cleanDialogueLine(d.line)}</span>
            </div>
            {style.side === "justify-end" && (
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${style.avatar}`}>
                {style.label}
              </span>
            )}
          </div>
            );
          })}
        </div>

        {actPoints.length > 0 && (
          <div className="mt-5 flex flex-col gap-3 border-t border-border-soft pt-4">
            <p className="text-[12px] font-semibold tracking-wide text-gold-700">
              临床决策互动
            </p>
            {actPoints.map((p, i) => (
              <DecisionPointCard
                key={p.id}
                point={p}
                index={i}
                mode="interactive"
                onAlternativeSelect={(alternativeId) =>
                  onAlternativeSelect?.(p.id, alternativeId)
                }
              />
            ))}
          </div>
        )}

        {act.transition && (
          <p className="mt-4 border-t border-border-soft pt-3 text-[12px] italic leading-relaxed text-foreground-faint">
            转场：{act.transition}
          </p>
        )}
      </div>
    </div>
  );
}
