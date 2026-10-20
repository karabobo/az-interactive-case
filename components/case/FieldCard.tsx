"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { CaseField } from "@/lib/types/case";
import { useCaseStore } from "@/lib/store/case-store";

export function FieldCard({ field }: { field: CaseField }) {
  const updateFieldValue = useCaseStore((s) => s.updateFieldValue);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(field.value ?? "");

  const commit = () => {
    updateFieldValue(field.id, draft.trim());
    setEditing(false);
  };

  return (
    <div className="group rounded-lg border border-border bg-surface p-3">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wide text-foreground-faint">
          {field.label}
        </span>
        <div className="flex items-center gap-1.5">
          {field.provenance === "ai_completed" && (
            <Badge tone="gold">AI补全 · 待核实</Badge>
          )}
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="rounded p-1 text-foreground-faint opacity-0 transition-opacity hover:bg-surface-sunken hover:text-foreground group-hover:opacity-100"
            aria-label={`编辑${field.label}`}
          >
            <Pencil size={13} />
          </button>
        </div>
      </div>

      {editing ? (
        <textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          rows={3}
          className="w-full resize-none rounded-md border border-brand-400 bg-surface px-2 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand-200"
        />
      ) : field.value ? (
        <p className="text-sm leading-relaxed text-foreground">{field.value}</p>
      ) : (
        <p className="text-sm italic text-foreground-faint">待补充</p>
      )}
    </div>
  );
}
