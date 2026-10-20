"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2, Monitor, MonitorPlay, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AvatarPicker } from "@/components/template/AvatarPicker";
import { TemplatePicker } from "@/components/template/TemplatePicker";
import { InteractiveH5Preview } from "@/components/template/InteractiveH5Preview";
import { PreviewQrCode } from "@/components/template/PreviewQrCode";
import { ProjectSaveBar } from "@/components/case/ProjectSaveBar";
import { useCaseStore } from "@/lib/store/case-store";

export default function RenderPage() {
  const [previewMode, setPreviewMode] = useState<"mobile" | "desktop">("mobile");
  const {
    projectId,
    fields,
    storyActs,
    triggeredDecisionPoints,
    doctorAvatar,
    patientAvatar,
    status,
    runRender,
    selectInteractionAlternative,
  } = useCaseStore();

  if (fields.length === 0) {
    return <div className="rounded-2xl border border-border bg-surface p-6 text-sm text-foreground-soft">还没有病例数据，请先完成<Link href="/create/case-input" className="mx-1 text-brand-600 underline">结构化病例</Link>步骤。</div>;
  }
  if (storyActs.length === 0) {
    return <div className="rounded-2xl border border-border bg-surface p-6 text-sm text-foreground-soft">请先完成<Link href="/create/story-outline" className="mx-1 text-brand-600 underline">互动剧情生成</Link>，再将完整诊疗剧情组装为互动 H5。</div>;
  }

  const readyToRender = Boolean(doctorAvatar && patientAvatar);
  const rendered = status.render === "success";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">形象与H5生成</h1>
        <p className="mt-1 text-sm text-foreground-soft">选择固定医生与患者形象，将完整诊疗剧情组装成可操作互动 H5；默认以手机端预览，也可切换电脑端展示。</p>
      </div>

      <section id="avatar" className="scroll-mt-24 rounded-2xl border border-border bg-surface p-5">
        <p className="mb-4 text-sm font-semibold text-foreground">人物形象 <span className="ml-1.5 text-xs font-normal text-foreground-faint">本版本使用固定素材，不调用 AI 生成</span></p>
        <AvatarPicker />
        <div className="my-5 border-t border-border-soft" />
        <p className="mb-2 text-sm font-medium text-foreground">页面视觉 <span className="font-normal text-foreground-faint">（可选）</span></p>
        <TemplatePicker />
      </section>

      <section id="render" className="scroll-mt-24 rounded-2xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">生成互动 H5</p>
            <p className="mt-1 text-[12px] text-foreground-faint">宽屏展示诊疗剧情、医患对话与对应时间节点的临床决策互动。</p>
          </div>
          <Button onClick={runRender} disabled={!readyToRender || status.render === "loading"}>
            {status.render === "loading" ? <><Loader2 size={15} className="animate-spin" />正在生成…</> : <><MonitorPlay size={15} />生成互动预览</>}
          </Button>
        </div>
        {!readyToRender && <p className="mt-3 text-xs text-foreground-faint">请先各选择一个医生与患者形象。</p>}

        {rendered && doctorAvatar && patientAvatar && (
          <div className="mt-6 flex flex-col gap-5">
            <div className="rounded-xl border border-brand-100 bg-brand-50/45 p-4">
              <p className="mb-3 text-sm font-semibold text-foreground">保存并生成扫码预览</p>
              <ProjectSaveBar />
              <p className="mt-2 text-xs text-foreground-faint">保存后二维码会立即出现；无需返回结构化病例页面。</p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-sunken px-5 py-4 text-[13px] leading-relaxed text-foreground-soft">
              <div>
                <p className="font-semibold text-foreground">{previewMode === "mobile" ? "手机端互动预览" : "电脑端互动预览"}</p>
                <p className="mt-1">医患对话按剧情逐句推进；每个决策点逐个出现，选择一个方向后可展开查看该方向的支持证据与适用条件。</p>
              </div>
              <div className="inline-flex rounded-lg border border-border bg-white p-1">
                <button type="button" onClick={() => setPreviewMode("mobile")} className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${previewMode === "mobile" ? "bg-brand-600 text-white" : "text-foreground-soft hover:bg-surface-sunken"}`}><Smartphone size={14} />手机端</button>
                <button type="button" onClick={() => setPreviewMode("desktop")} className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${previewMode === "desktop" ? "bg-brand-600 text-white" : "text-foreground-soft hover:bg-surface-sunken"}`}><Monitor size={14} />电脑端</button>
              </div>
            </div>
            <InteractiveH5Preview
              acts={storyActs}
              points={triggeredDecisionPoints.filter((point) => point.included !== false)}
              doctorAvatar={doctorAvatar}
              patientAvatar={patientAvatar}
              onAlternativeSelect={selectInteractionAlternative}
              viewMode={previewMode}
            />
            {projectId ? <PreviewQrCode path={`/preview/${projectId}`} /> : <div className="rounded-xl border border-dashed border-border bg-surface-sunken px-4 py-3 text-xs text-foreground-soft">请先回到「结构化病例」保存当前病例项目，系统才会生成可供手机扫码的预览链接。</div>}
          </div>
        )}
      </section>
    </div>
  );
}
