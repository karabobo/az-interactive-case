"use client";

import { Bot } from "lucide-react";
import { useCaseStore } from "@/lib/store/case-store";
import { MODEL_OPTIONS } from "@/lib/ai/model-catalog";

export function ModelSelector() {
  const { selectedModelId, setSelectedModelId } = useCaseStore();

  return (
    <div className="flex items-center gap-1.5">
      <Bot size={13} className="text-foreground-faint" />
      <div className="flex gap-1 rounded-lg border border-border bg-surface-sunken p-0.5">
        {MODEL_OPTIONS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setSelectedModelId(m.id)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              selectedModelId === m.id
                ? "bg-surface text-brand-700 shadow-sm"
                : "text-foreground-faint hover:text-foreground-soft"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}
