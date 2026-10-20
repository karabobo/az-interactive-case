"use client";

import { usePathname, useRouter } from "next/navigation";
import { Check } from "lucide-react";

export interface StepDef {
  key: string;
  href: string;
  label: string;
  sublabel: string;
}

export const CREATE_STEPS: StepDef[] = [
  {
    key: "case-input",
    href: "/create/case-input",
    label: "结构化病例",
    sublabel: "上传 · 提取 · 必填项检查",
  },
  {
    key: "story-outline",
    href: "/create/story-outline",
    label: "互动剧情生成",
    sublabel: "剧情图谱 · 场景对话 · 互动编排",
  },
  {
    key: "render",
    href: "/create/render",
    label: "形象与H5生成",
    sublabel: "形象选择 · 渲染预览 · 送审对接",
  },
];

export function Stepper({ currentIndex }: { currentIndex: number }) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3">
      {CREATE_STEPS.map((step, i) => {
        const state =
          i < currentIndex ? "done" : i === currentIndex ? "active" : "todo";
        const clickable = i <= currentIndex;
        return (
          <div key={step.key} className="flex flex-1 items-center gap-2">
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && router.push(step.href)}
              className={`flex flex-1 items-center gap-3 rounded-lg px-3 py-1.5 text-left transition-colors ${
                state === "active"
                  ? "bg-brand-50"
                  : clickable
                  ? "hover:bg-surface-sunken"
                  : ""
              } ${clickable ? "cursor-pointer" : "cursor-default"}`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  state === "done"
                    ? "bg-teal-500 text-white"
                    : state === "active"
                    ? "bg-brand-700 text-white"
                    : "bg-surface-sunken text-foreground-faint"
                }`}
              >
                {state === "done" ? <Check size={14} /> : i + 1}
              </span>
              <span className="min-w-0">
                <span
                  className={`block truncate text-sm font-medium ${
                    state === "todo" ? "text-foreground-faint" : "text-foreground"
                  }`}
                >
                  {step.label}
                </span>
                <span className="block truncate text-[11px] text-foreground-faint">
                  {step.sublabel}
                </span>
              </span>
            </button>
            {i < CREATE_STEPS.length - 1 && (
              <span className="h-px w-6 shrink-0 bg-border" />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function useCurrentStepIndex() {
  const pathname = usePathname();
  const idx = CREATE_STEPS.findIndex((s) => pathname?.startsWith(s.href));
  return idx === -1 ? 0 : idx;
}
