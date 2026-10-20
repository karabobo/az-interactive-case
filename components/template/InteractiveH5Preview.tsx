"use client";

import { useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, MessageCircle, Stethoscope } from "lucide-react";
import type { DoctorAvatar, PatientAvatar, StoryAct, TriggeredDecisionPoint } from "@/lib/types/case";

const ASSET_ROOT = "/assets/interactive-case";
const DOCTOR_IMAGE: Record<DoctorAvatar, string> = {
  doctor_male: `${ASSET_ROOT}/doctor-male-v2.png`,
  doctor_female: `${ASSET_ROOT}/doctor-female-v2.png`,
};
const PATIENT_IMAGE: Record<PatientAvatar, string> = {
  patient_male: `${ASSET_ROOT}/patient-male-v2.png`,
  patient_female: `${ASSET_ROOT}/patient-female-v2.png`,
};

function cleanLine(line: string) {
  return line.trim().replace(/^\*\*(?:医生|患者|病人)\*\*\s*[:：]?\s*/u, "").replace(/^(?:医生|患者|病人)\s*[:：]\s*/u, "");
}

/** 宽屏舞台式互动病例播放器：背景、人物和对话处于同一诊疗场景中。 */
export function InteractiveH5Preview({ acts, points, doctorAvatar, patientAvatar, onAlternativeSelect, viewMode = "desktop" }: {
  acts: StoryAct[];
  points: TriggeredDecisionPoint[];
  doctorAvatar: DoctorAvatar;
  patientAvatar: PatientAvatar;
  onAlternativeSelect: (pointId: string, alternativeId: string) => void;
  viewMode?: "desktop" | "mobile";
}) {
  const [actIndex, setActIndex] = useState(0);
  const [lineIndex, setLineIndex] = useState(0);
  const [expandedEvidenceId, setExpandedEvidenceId] = useState<string | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const act = acts[actIndex];
  const activeLine = act.dialogue[Math.min(lineIndex, Math.max(0, act.dialogue.length - 1))];
  const patientSpeaking = activeLine ? /患者|病人/.test(activeLine.speaker) : false;
  const sceneComplete = lineIndex >= act.dialogue.length - 1;
  const actPoints = useMemo(() => act.decisionPointIds.map((id) => points.find((point) => point.id === id)).filter((point): point is TriggeredDecisionPoint => Boolean(point)), [act.decisionPointIds, points]);
  const needsChoice = actPoints.filter((point) => point.alternatives.length > 0);
  const choicesCompleted = needsChoice.every((point) => point.selectedAlternativeId);
  const activePoint = sceneComplete ? actPoints[questionIndex] : undefined;
  const activePointAnswered = !activePoint || activePoint.alternatives.length === 0 || Boolean(activePoint.selectedAlternativeId);
  const hasNextQuestion = questionIndex < actPoints.length - 1;
  const isFirst = actIndex === 0;
  const isLast = actIndex === acts.length - 1;
  const moveToAct = (index: number) => { setActIndex(index); setLineIndex(0); setQuestionIndex(0); setExpandedEvidenceId(null); };

  return (
    <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-2xl shadow-brand-900/20 ${viewMode === "mobile" ? "mx-auto max-w-[420px]" : ""}`}>
      <header className="relative z-20 flex items-center justify-between bg-gradient-to-r from-brand-900/95 via-violet-900/95 to-wine-800/95 px-7 py-4 text-white backdrop-blur-md">
        <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15"><Stethoscope size={19} /></span><div><p className="text-[10px] font-medium tracking-[0.18em] text-white/60">INTERACTIVE CASE</p><h3 className="text-lg font-semibold">{act.title}</h3></div></div>
        <span className="text-sm text-white/80">场景 {actIndex + 1} / {acts.length}</span>
      </header>

      <section className={`relative overflow-hidden bg-cover bg-center ${viewMode === "mobile" ? "min-h-[720px]" : "min-h-[620px]"}`} style={{ backgroundImage: `url('${ASSET_ROOT}/clinic-background-v2.png')` }}>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/15 to-brand-950/25" />
        <div className="absolute inset-x-0 top-0 z-10 flex gap-1.5 px-7 py-4">{acts.map((item, index) => <span key={item.id} className={`h-1 flex-1 rounded-full shadow ${index <= actIndex ? "bg-white" : "bg-white/35"}`} />)}</div>

        <div className="absolute left-1/2 top-11 z-10 w-[min(560px,72%)] -translate-x-1/2 rounded-2xl border border-white/30 bg-white/20 px-5 py-3 text-center text-sm leading-relaxed text-white shadow-lg backdrop-blur-md">
          <span className="mr-1.5 font-semibold text-white">场景</span>{act.sceneDirection}
        </div>

        <img src={DOCTOR_IMAGE[doctorAvatar]} alt="医生形象" className={`absolute bottom-0 left-[-2%] z-[3] object-contain object-bottom drop-shadow-2xl transition-opacity duration-300 ${viewMode === "mobile" ? "h-[55%] max-w-[70%]" : "h-[84%] max-w-[48%]"} ${patientSpeaking ? "opacity-65" : "opacity-100"}`} />
        <img src={PATIENT_IMAGE[patientAvatar]} alt="患者形象" className={`absolute bottom-0 right-[-2%] z-[3] object-contain object-bottom drop-shadow-2xl transition-opacity duration-300 ${viewMode === "mobile" ? "h-[50%] max-w-[66%]" : "h-[76%] max-w-[45%]"} ${patientSpeaking ? "opacity-100" : "opacity-65"}`} />

        {activeLine && (
          <div className={`absolute z-20 ${viewMode === "mobile" ? "left-4 right-4 top-[255px] w-auto" : `bottom-12 w-[min(500px,52%)] ${patientSpeaking ? "right-[11%]" : "left-[11%]"}`}`}>
            <div className={`rounded-2xl border border-white/45 bg-white/82 px-5 py-4 text-sm leading-relaxed text-slate-800 shadow-2xl backdrop-blur-xl ${patientSpeaking ? "rounded-br-sm" : "rounded-bl-sm"}`}>
              <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold text-brand-800"><MessageCircle size={14} />{patientSpeaking ? "患者" : "医生"}<span className="font-normal text-slate-400">· 对话 {lineIndex + 1}/{act.dialogue.length}</span></div>
              {cleanLine(activeLine.line)}
            </div>
          </div>
        )}

        {activePoint && (
          <aside className={`absolute z-30 overflow-y-auto overscroll-contain rounded-2xl border border-gold-200/80 bg-white/90 p-4 pr-3 shadow-2xl backdrop-blur-xl touch-pan-y ${viewMode === "mobile" ? "left-3 right-3 top-[390px] bottom-4 w-auto" : "right-5 top-24 bottom-5 w-[min(360px,37%)]"}`}>
            <p className="text-[11px] font-semibold tracking-[0.14em] text-gold-700">临床决策互动</p>
            <section className="mt-3 rounded-xl border border-gold-200 bg-gold-50/70 p-3"><h4 className="text-sm font-semibold leading-relaxed text-slate-800">{activePoint.decisionPointName}</h4><div className="mt-3 flex flex-col gap-2">{activePoint.alternatives.map((alternative, alternativeIndex) => {
              const selected = activePoint.selectedAlternativeId === alternative.id;
              const evidenceId = `${activePoint.id}-${alternative.id}`;
              const expanded = expandedEvidenceId === evidenceId;
              return <div key={alternative.id} className={`rounded-lg border p-2.5 ${selected ? "border-brand-500 bg-white" : "border-gold-200 bg-white/75"}`}><button type="button" className="w-full text-left" onClick={() => { onAlternativeSelect(activePoint.id, alternative.id); setExpandedEvidenceId(expanded ? null : evidenceId); }}><span className="flex items-center justify-between gap-3 text-xs font-semibold text-brand-700">方向 {String.fromCharCode(65 + alternativeIndex)} {selected && <Check size={15} />}</span><span className="mt-1.5 block text-[13px] leading-relaxed text-slate-700">{alternative.content}</span></button>{expanded && <div className="mt-3 border-t border-gold-100 pt-3 text-xs leading-relaxed text-slate-600"><p><b>支持证据：</b>{alternative.rationale}</p><p className="mt-1.5"><b>适用条件：</b>{alternative.applicableCondition}</p></div>}</div>;
            })}</div></section>
          </aside>
        )}
        {sceneComplete && act.transition && <p className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 text-center text-xs italic text-white/75">{act.transition}</p>}
      </section>

      <footer className="relative z-20 flex items-center justify-between bg-white px-6 py-4">
        <button type="button" onClick={() => moveToAct(Math.max(0, actIndex - 1))} disabled={isFirst} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-35"><ChevronLeft size={16} />上一场景</button>
        {!sceneComplete ? <button type="button" onClick={() => setLineIndex((index) => Math.min(act.dialogue.length - 1, index + 1))} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">下一句<ChevronRight size={16} /></button> : activePoint && !activePointAnswered ? <span className="text-sm text-gold-700">请选择一个方向</span> : hasNextQuestion ? <button type="button" onClick={() => { setQuestionIndex((index) => index + 1); setExpandedEvidenceId(null); }} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">下一互动题<ChevronRight size={16} /></button> : isLast ? <span className="text-sm font-medium text-brand-700">病例互动已完成</span> : <button type="button" onClick={() => moveToAct(Math.min(acts.length - 1, actIndex + 1))} disabled={!choicesCompleted} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40">{choicesCompleted ? "进入下一场景" : "请先选择方向"}<ChevronRight size={16} /></button>}
      </footer>
    </div>
  );
}
