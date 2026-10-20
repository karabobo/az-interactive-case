"use client";

import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCaseStore } from "@/lib/store/case-store";

export function ProjectSaveBar() {
  const {
    projectName,
    projectUpdatedAt,
    persistenceStatus,
    persistenceError,
    setProjectName,
    saveProject,
  } = useCaseStore();
  const saving = persistenceStatus === "loading";

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border-soft bg-surface-sunken px-4 py-3">
      <label className="flex min-w-[220px] flex-1 items-center gap-2 text-sm text-foreground-soft">
        <span className="shrink-0">病例项目</span>
        <input
          value={projectName}
          onChange={(event) => setProjectName(event.target.value)}
          maxLength={80}
          className="w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-brand-400"
        />
      </label>
      <Button onClick={saveProject} disabled={saving || !projectName.trim()}>
        {saving ? <><Loader2 size={15} className="animate-spin" />保存中…</> : <><Save size={15} />保存病例</>}
      </Button>
      {persistenceStatus === "success" && projectUpdatedAt && <span className="text-xs text-teal-700">已保存</span>}
      {persistenceStatus === "error" && <span className="text-xs text-wine-700">{persistenceError}</span>}
    </div>
  );
}
