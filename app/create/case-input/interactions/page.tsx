"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, Clock3, Download, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DecisionPointCard } from "@/components/outline/DecisionPointCard";
import { ProjectSaveBar } from "@/components/case/ProjectSaveBar";
import { downloadStructuredCaseDocx } from "@/lib/export/structured-case-docx";
import { useCaseStore } from "@/lib/store/case-store";
import { STAGE_LABEL, STAGE_ORDER } from "@/lib/types/case";

export default function InteractionCurationPage() {
  const router = useRouter();
  const {
    baseCaseConfirmed, input, fields, clinicalTimeline, inference, triggeredDecisionPoints,
    degraded, status, errors, projectName, runQaGeneration, setDecisionPointIncluded,
    updateDecisionPointName, addCustomInteractionSuggestion,
  } = useCaseStore();
  const [customSuggestion, setCustomSuggestion] = useState("");
  const [customStage, setCustomStage] = useState<Exclude<(typeof STAGE_ORDER)[number], "case_summary">>("treatment_course");
  const qaDone = status.qa === "success" || triggeredDecisionPoints.length > 0 || degraded;
  const sortedPoints = [...triggeredDecisionPoints].sort((a, b) => STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage));
  const includedPoints = sortedPoints.filter((point) => point.included !== false);

  if (!baseCaseConfirmed) {
    return <div className="rounded-2xl border border-border bg-surface p-6 text-sm text-foreground-soft">请先在<Link href="/create/case-input" className="mx-1 text-brand-600 underline">结构化病例</Link>中确认基础病例。</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-semibold tracking-[0.14em] text-brand-700">结构化病例 · 互动问题</p>
        <h1 className="mt-1 text-xl font-semibold text-foreground">互动问题生成</h1>
        <p className="mt-1 text-sm text-foreground-soft">根据已确认的基础病例检索临床决策点，并在对应诊疗时间节点完成病例级编排。</p>
      </div>
      <ProjectSaveBar />

      {!qaDone && (
        <section className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-sm font-semibold text-foreground">检索决策分支点库</p>
          <p className="mt-1 text-[13px] text-foreground-soft">{input.product ? `按所选药品「${input.product}」检索并匹配互动问题。` : "未选择药品名称，将按静态病例继续。"}</p>
          <Button className="mt-4" onClick={runQaGeneration} disabled={status.qa === "loading"}>
            {status.qa === "loading" ? <><Loader2 size={15} className="animate-spin" />正在检索决策分支点库…</> : "生成互动问题"}
          </Button>
          {status.qa === "error" && <div className="mt-4 flex gap-2 rounded-lg border border-wine-100 bg-wine-100/60 p-3 text-sm text-wine-700"><AlertTriangle size={16} /><div><p className="font-medium">生成失败</p><p className="mt-1 text-[13px]">{errors.qa}</p></div></div>}
        </section>
      )}

      {qaDone && <>
        {inference && <section className="rounded-2xl border border-brand-100 bg-brand-50 p-5"><div className="flex items-center gap-2 text-sm font-semibold text-brand-700"><Sparkles size={14} />决策分支点库匹配</div><p className="mt-2 text-sm text-foreground">{inference.matchedLibraryId ? `${inference.product} · ${inference.diseaseArea}` : inference.reasoning}</p><p className="mt-1 text-[12px] text-foreground-faint">{inference.reasoning}</p></section>}

        {clinicalTimeline.length > 0 && <section className="rounded-2xl border border-border bg-surface p-5"><div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground"><Clock3 size={14} className="text-brand-600" />病例诊疗时间线 <span className="text-xs font-normal text-foreground-faint">互动题将插入对应节点</span></div><div className="flex flex-wrap gap-2">{clinicalTimeline.map((node) => <div key={node.id} className="min-w-32 rounded-lg border border-border bg-surface-sunken px-3 py-2"><p className="text-[12px] font-medium text-foreground">{node.title}</p><p className="mt-0.5 text-[11px] text-foreground-faint">{node.occurredAt ?? "时间待补充"}</p></div>)}</div></section>}

        {degraded ? <section className="rounded-2xl border border-gold-100 bg-gold-100/50 p-5 text-sm text-gold-700">暂无可插入当前病例时间线的决策点，可继续以静态病例展示。</section> : <section className="rounded-2xl border border-border bg-surface p-5"><p className="text-sm font-semibold text-foreground">匹配到 {sortedPoints.length} 个互动问题</p><p className="mt-1 text-[12px] text-foreground-faint">当前纳入 {includedPoints.length} 个。可编辑题干、取消不需要的题目，或补充病例特有的互动提示。</p><div className="mt-4 flex flex-col gap-3">{sortedPoints.map((point, index) => <DecisionPointCard key={point.id} point={point} index={index} onIncludedChange={(included) => setDecisionPointIncluded(point.id, included)} onNameChange={(name) => updateDecisionPointName(point.id, name)} />)}</div><div className="mt-4 rounded-xl border border-dashed border-brand-200 bg-brand-50/40 p-4"><p className="text-sm font-semibold text-foreground">补充互动提示</p><div className="mt-3 flex flex-col gap-2 sm:flex-row"><select value={customStage} onChange={(event) => setCustomStage(event.target.value as Exclude<(typeof STAGE_ORDER)[number], "case_summary">)} className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground">{STAGE_ORDER.filter((stage) => stage !== "case_summary").map((stage) => <option key={stage} value={stage}>{STAGE_LABEL[stage]}</option>)}</select><input value={customSuggestion} onChange={(event) => setCustomSuggestion(event.target.value)} placeholder="例如：与患者共同讨论脑转移随访计划" className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground" /><Button variant="secondary" disabled={!customSuggestion.trim()} onClick={() => { addCustomInteractionSuggestion({ stage: customStage, content: customSuggestion }); setCustomSuggestion(""); }}>添加提示</Button></div></div></section>}

        <section className="rounded-2xl border border-border bg-surface p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold text-foreground">完整结构化病例</p><p className="mt-1 text-[12px] text-foreground-faint">基础病例与已纳入互动问题会一并进入 Word 与剧情生成。</p></div><Button variant="secondary" onClick={() => downloadStructuredCaseDocx({ projectName, fields, interactionPoints: includedPoints })}><Download size={14} />下载Word病例</Button></div></section>

        <div className="flex justify-end"><Button onClick={() => router.push("/create/story-outline")}>下一步：互动剧情生成 <ArrowRight size={15} /></Button></div>
      </>}
    </div>
  );
}
