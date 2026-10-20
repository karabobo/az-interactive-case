"use client";

import { useCaseStore } from "@/lib/store/case-store";
import type { TemplateId } from "@/lib/types/case";

const TEMPLATES: { id: TemplateId; label: string; desc: string }[] = [
  { id: "general", label: "通用模板", desc: "标准互动病例版式，适配多数场景" },
  { id: "brand", label: "品牌模板", desc: "套用品牌视觉规范的定制版式" },
];

export function TemplatePicker() {
  const { template, setTemplate } = useCaseStore();

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {TEMPLATES.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => setTemplate(t.id)}
          className={`rounded-xl border p-4 text-left transition-colors ${
            template === t.id
              ? "border-brand-500 bg-brand-50"
              : "border-border bg-surface hover:border-brand-200"
          }`}
        >
          <div className="mb-2 h-20 rounded-lg bg-gradient-to-br from-brand-100 to-violet-400/30" />
          <p className="text-sm font-medium text-foreground">{t.label}</p>
          <p className="mt-0.5 text-[12px] text-foreground-faint">{t.desc}</p>
        </button>
      ))}
    </div>
  );
}
