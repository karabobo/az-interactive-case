"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import {
  ORIENTATION_LABEL,
  STAGE_LABEL,
  type TriggeredDecisionPoint,
} from "@/lib/types/case";

export function DecisionPointCard({
  point,
  index,
  mode = "library",
  onIncludedChange,
  onNameChange,
  onAlternativeSelect,
}: {
  point: TriggeredDecisionPoint;
  index: number;
  mode?: "library" | "interactive";
  onIncludedChange?: (included: boolean) => void;
  onNameChange?: (name: string) => void;
  onAlternativeSelect?: (alternativeId: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [expandedAlternativeId, setExpandedAlternativeId] = useState<string | null>(
    null
  );
  const included = point.included !== false;
  const isCustom = point.source === "custom_suggestion";

  return (
    <div
      className={`rounded-xl border bg-surface p-4 ${
        included ? "border-border" : "border-border-soft opacity-60"
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Badge tone="wine">{STAGE_LABEL[point.stage]}</Badge>
            {point.orientation && (
              <Badge
                tone={
                  point.orientation === "leverage"
                    ? "brand"
                    : point.orientation === "defense"
                    ? "teal"
                    : "neutral"
                }
              >
                {ORIENTATION_LABEL[point.orientation]}
              </Badge>
            )}
            {point.timelineNodeLabel && (
              <Badge tone="neutral">时间线：{point.timelineNodeLabel}</Badge>
            )}
            {point.triggerLabel && (
              <Badge tone="neutral">{point.triggerLabel}</Badge>
            )}
          </div>
          {editing ? (
            <input
              value={point.decisionPointName}
              onChange={(event) => onNameChange?.(event.target.value)}
              onBlur={() => setEditing(false)}
              autoFocus
              className="w-full rounded-md border border-brand-300 bg-surface px-2 py-1 text-sm font-semibold text-foreground outline-none"
            />
          ) : (
            <h4 className="text-sm font-semibold text-foreground">
              {isCustom ? "自定义提示" : `决策点 ${index + 1}`} · {point.decisionPointName}
            </h4>
          )}
          {point.matchedPopulationTagLabels.length > 0 && (
            <p className="mt-1 text-[12px] text-foreground-faint">
              匹配人群标签：{point.matchedPopulationTagLabels.join(" / ")}
            </p>
          )}
          {point.insertionReason && (
            <p className="mt-1 text-[12px] text-foreground-faint">
              {point.insertionReason}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {onNameChange && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-md p-1 text-foreground-faint hover:bg-surface-sunken hover:text-brand-600"
              title="编辑题干"
            >
              <Pencil size={14} />
            </button>
          )}
          {onIncludedChange && (
            <label className="flex cursor-pointer items-center gap-1.5 text-[12px] font-medium text-foreground-soft">
              <input
                type="checkbox"
                checked={included}
                onChange={(event) => onIncludedChange(event.target.checked)}
                className="accent-brand-600"
              />
              纳入
            </label>
          )}
        </div>
      </div>

      {!isCustom && <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {point.alternatives.map((alt, i) => {
          const expanded = expandedAlternativeId === alt.id;
          const selected = point.selectedAlternativeId === alt.id;
          return (
            <div
              key={alt.id}
              className={`flex flex-col gap-1.5 rounded-lg border p-3 text-left ${
                selected
                  ? "border-brand-500 bg-brand-50"
                  : "border-border bg-surface"
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  setExpandedAlternativeId(expanded ? null : alt.id);
                  if (mode === "interactive") onAlternativeSelect?.(alt.id);
                }}
                className="text-left"
              >
                <span className="text-[11px] font-medium text-foreground-faint">
                  方向 {String.fromCharCode(65 + i)}
                  {selected ? " · 已选择" : ""}
                </span>
                <p className="mt-1 text-sm leading-snug text-foreground">
                  {alt.content}
                </p>
                <span className="mt-2 block text-[11px] text-brand-600">
                  {expanded ? "收起支持证据" : "点击查看支持证据"}
                </span>
              </button>
              {expanded && (
                <div className="mt-1 border-t border-border-soft pt-2 text-[12px] leading-relaxed text-foreground-soft">
                  <p>
                    <span className="font-medium text-foreground">支持证据：</span>
                    {alt.rationale}
                  </p>
                  <p className="mt-1">
                    <span className="font-medium text-foreground">适用条件：</span>
                    {alt.applicableCondition}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>}

      {isCustom && (
        <p className="rounded-lg bg-surface-sunken p-3 text-sm text-foreground-soft">
          这是用户补充的开放式互动提示，将按所选时间线节点进入后续故事线与 H5。
        </p>
      )}
    </div>
  );
}
