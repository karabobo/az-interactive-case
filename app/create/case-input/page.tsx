"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Clock3,
  Download,
  Loader2,
  Sparkles,
} from "lucide-react";
import { ScenarioPanel } from "@/components/case/ScenarioPanel";
import { UploadPanel } from "@/components/case/UploadPanel";
import { ImagePanel } from "@/components/case/ImagePanel";
import { ModelSelector } from "@/components/case/ModelSelector";
import { FieldGroup } from "@/components/case/FieldGroup";
import { DecisionPointCard } from "@/components/outline/DecisionPointCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProjectSaveBar } from "@/components/case/ProjectSaveBar";
import { downloadStructuredCaseDocx } from "@/lib/export/structured-case-docx";
import { useCaseStore } from "@/lib/store/case-store";
import {
  STAGE_LABEL,
  STAGE_ORDER,
} from "@/lib/types/case";

export default function CaseInputPage() {
  const router = useRouter();
  const {
    input,
    fields,
    completenessNotes,
    baseCaseConfirmed,
    clinicalTimeline,
    inference,
    triggeredDecisionPoints,
    degraded,
    status,
    errors,
    extractionStreamText,
    runExtraction,
    confirmBaseCase,
    runQaGeneration,
    setDecisionPointIncluded,
    updateDecisionPointName,
    addCustomInteractionSuggestion,
    projectName,
  } = useCaseStore();
  const [customSuggestion, setCustomSuggestion] = useState("");
  const [customStage, setCustomStage] = useState<
    Exclude<(typeof STAGE_ORDER)[number], "case_summary">
  >("treatment_course");

  // 产品（第4步）标注为可选，不计入必选的前置门槛——与参考站文案一致
  const preSelectionDone = Boolean(
    input.scenario && input.audience && input.diseaseType
  );
  const canExtract =
    preSelectionDone &&
    Boolean(input.caseDocument) &&
    status.extraction !== "loading";
  const extracted = status.extraction === "success" && fields.length > 0;
  // 恢复已保存病例时，状态机的临时 success 不存在；以保存下来的互动编排/降级结果为准。
  const qaDone = status.qa === "success" || triggeredDecisionPoints.length > 0 || degraded;
  const sortedPoints = [...triggeredDecisionPoints].sort(
    (a, b) => STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage)
  );
  const includedPointCount = sortedPoints.filter(
    (point) => point.included !== false
  ).length;
  const includedInteractionPoints = sortedPoints.filter(
    (point) => point.included !== false
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">结构化病例</h1>
        <p className="mt-1 text-sm text-foreground-soft">
          场景选择 → 上传资料 → 提取信息 → 生成基础病例（含必选项检查、上传图片）→ 互动问题生成 → 结构化病例生成，AI按「通用诊疗路径」提取标准病例字段——就诊 / 相关检查 / 诊断 / 治疗经过 / 随访 / 病例小结。
        </p>
      </div>

      <ProjectSaveBar />

      {/* 1. 场景选择 */}
      <div id="scenario" className="scroll-mt-24 rounded-2xl border border-border bg-surface p-5">
        <p className="mb-4 text-sm font-semibold text-foreground">场景选择</p>
        <ScenarioPanel />
      </div>

      {/* 2. 上传资料 */}
      <div id="upload" className="scroll-mt-24 rounded-2xl border border-border bg-surface p-5">
        <p className="mb-4 text-sm font-semibold text-foreground">上传资料</p>
        <UploadPanel />
      </div>

      {/* 3. 提取信息 */}
      <div id="extract" className="scroll-mt-24 rounded-2xl border border-border bg-surface p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">提取信息</p>
          <ModelSelector />
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={runExtraction} disabled={!canExtract}>
            {status.extraction === "loading" ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                正在提取信息…
              </>
            ) : (
              "执行【信息提取】"
            )}
          </Button>
          {!preSelectionDone ? (
            <span className="text-xs text-foreground-faint">
              请先完成上方「场景选择」的1-3项（应用场景/目标受众/疾病类型）
            </span>
          ) : (
            !input.caseDocument && (
              <span className="text-xs text-foreground-faint">
                请先上传病例文档
              </span>
            )
          )}
        </div>

        {status.extraction === "loading" && extractionStreamText && (
          <pre className="mt-4 max-h-48 overflow-y-auto whitespace-pre-wrap rounded-lg bg-surface-sunken p-3 text-[12px] leading-relaxed text-foreground-soft">
            {extractionStreamText}
            <span className="animate-pulse">▍</span>
          </pre>
        )}

        {status.extraction === "error" && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-wine-100 bg-wine-100/60 p-3 text-sm text-wine-700">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">提取失败</p>
              <p className="mt-0.5 text-[13px]">{errors.extraction}</p>
              <button
                onClick={runExtraction}
                className="mt-2 text-[13px] font-medium underline underline-offset-2"
              >
                重试
              </button>
            </div>
          </div>
        )}
      </div>

      {extracted && (
        <>
          {/* 生成基础病例：必选项检查 + 上传图片 都是其子部分，确认按钮放最下面 */}
          <div id="base-case" className="scroll-mt-24 rounded-2xl border border-border bg-surface p-5">
            <p className="text-sm font-semibold text-foreground">生成基础病例</p>
            <p className="mb-4 text-[12px] text-foreground-faint">
              核对/编辑下方字段、按需补充图片、核对必选项检查，确认后作为基础病例进入下一步
            </p>

            {/* 字段核对/编辑 */}
            <div className="mb-4">
              <FieldGroup fields={fields} />
            </div>

            {/* 上传图片 */}
            <div className="mb-4 rounded-xl border border-border-soft bg-surface-sunken p-4">
              <p className="mb-1 text-sm font-semibold text-foreground">
                上传图片
              </p>
              <p className="mb-3 text-[12px] text-foreground-faint">
                可选，仅作素材保留，检查类型与报告结果需人工录入，不做AI图像理解
              </p>
              <ImagePanel />
            </div>

            {/* 必选项检查 */}
            <div className="mb-4 rounded-xl border border-gold-100 bg-gold-100/50 p-4">
              <p className="mb-2 text-sm font-semibold text-gold-700">
                必选项检查 · 建议补充
              </p>
              {completenessNotes.length > 0 ? (
                <ul className="flex flex-col gap-1.5">
                  {completenessNotes.map((note, i) => (
                    <li
                      key={i}
                      className="flex gap-2 text-[13px] leading-relaxed text-gold-700/90"
                    >
                      <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-gold-500" />
                      {note}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[13px] text-gold-700/90">
                  必选项均已覆盖，无需额外补充。
                </p>
              )}
              <p className="mt-2 text-[11px] text-gold-700/70">
                不阻断流程——可在下方直接编辑字段补充，也可以跳过继续。
              </p>
            </div>

            <div className="mt-4 flex justify-end">
              {baseCaseConfirmed ? (
                <div className="flex items-center gap-3">
                  <Badge tone="teal"><Check size={11} />已确认</Badge>
                  <Button
                    onClick={() => {
                      if (!qaDone && status.qa !== "loading") void runQaGeneration();
                      router.push("/create/case-input/interactions");
                    }}
                  >
                    {qaDone ? "查看互动问题" : "生成互动问题"}
                    <ArrowRight size={15} />
                  </Button>
                </div>
              ) : (
                <Button onClick={confirmBaseCase}>确认基础病例</Button>
              )}
            </div>
          </div>

          {/* 互动问题已迁至同一主步骤下的独立页面，保留旧结构仅避免中断已打开的热更新页面。 */}
          <div className="hidden">
          {baseCaseConfirmed && (
            <>
              {/* 6. 互动问题生成 */}
              <div
                id="qa-generation"
                className="scroll-mt-24 rounded-2xl border border-border bg-surface p-5"
              >
                <p className="mb-3 text-sm font-semibold text-foreground">
                  互动问题生成
                  <span className="ml-1.5 text-xs font-normal text-foreground-faint">
                    {input.product
                      ? `按所选药品「${input.product}」检索决策分支点库，匹配互动问题`
                      : "未选择药品名称——按ADR-0005降级为静态病例展示，可继续下一步"}
                  </span>
                </p>
                {status.qa !== "success" && (
                  <>
                    <Button
                      onClick={runQaGeneration}
                      disabled={status.qa === "loading"}
                    >
                      {status.qa === "loading" ? (
                        <>
                          <Loader2 size={15} className="animate-spin" />
                          正在检索决策分支点库…
                        </>
                      ) : (
                        "生成互动问题"
                      )}
                    </Button>
                    {status.qa === "error" && (
                      <div className="mt-4 flex items-start gap-2 rounded-lg border border-wine-100 bg-wine-100/60 p-3 text-sm text-wine-700">
                        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                        <div>
                          <p className="font-medium">生成失败</p>
                          <p className="mt-0.5 text-[13px]">{errors.qa}</p>
                          <button
                            onClick={runQaGeneration}
                            className="mt-2 text-[13px] font-medium underline underline-offset-2"
                          >
                            重试
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {qaDone && inference && (
                  <div className="mb-4 rounded-xl border border-brand-100 bg-brand-50 p-4">
                    <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-brand-700">
                      <Sparkles size={14} />
                      决策分支点库匹配
                    </div>
                    {inference.matchedLibraryId ? (
                      <p className="text-sm text-foreground">
                        {inference.product} · {inference.diseaseArea}
                        <Badge tone="brand" className="ml-2">
                          {inference.reviewSummary?.approved
                            ? "匹配库：已确认"
                            : "候选库：已定位"}
                        </Badge>
                      </p>
                    ) : (
                      <p className="text-sm text-foreground-soft">
                        {inference.reasoning}
                      </p>
                    )}
                    <p className="mt-1 text-[12px] text-foreground-faint">
                      {inference.reasoning}
                    </p>
                    {inference.reviewSummary && (
                      <p className="mt-2 text-[12px] text-foreground-faint">
                        {inference.reviewSummary.demoEnabled
                          ? `演示版已启用 ${inference.reviewSummary.total} 条决策点，可完整体验病例匹配与互动编排。`
                          : `库内共 ${inference.reviewSummary.total} 条：已批准 ${inference.reviewSummary.approved} 条，待审核 ${inference.reviewSummary.pendingReview} 条。 `}
                      </p>
                    )}
                  </div>
                )}

                {qaDone && clinicalTimeline.length > 0 && (
                  <div className="mb-4 rounded-xl border border-border-soft bg-surface-sunken p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Clock3 size={14} className="text-brand-600" />
                      病例诊疗时间线
                      <span className="text-xs font-normal text-foreground-faint">
                        命中的互动题将插入对应节点
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {clinicalTimeline.map((node) => (
                        <div
                          key={node.id}
                          className="min-w-32 rounded-lg border border-border bg-surface px-3 py-2"
                          title={node.summary}
                        >
                          <p className="text-[12px] font-medium text-foreground">
                            {node.title}
                          </p>
                          <p className="mt-0.5 text-[11px] text-foreground-faint">
                            {node.occurredAt ?? "时间待补充"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {qaDone && degraded && (
                  <div className="rounded-xl border border-gold-100 bg-gold-100/50 p-4 text-sm text-gold-700">
                    暂无可插入当前病例时间线的决策点，可继续以静态病例展示，或返回调整病例字段。
                  </div>
                )}

                {qaDone && !degraded && sortedPoints.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        匹配到 {sortedPoints.length} 个互动问题
                      </p>
                      <p className="mt-1 text-[12px] text-foreground-faint">
                        当前纳入 {includedPointCount} 个。可取消不需要的题目、编辑题干，或补充开放式互动提示。
                      </p>
                    </div>
                    {sortedPoints.map((p, i) => (
                      <DecisionPointCard
                        key={p.id}
                        point={p}
                        index={i}
                        onIncludedChange={(included) =>
                          setDecisionPointIncluded(p.id, included)
                        }
                        onNameChange={(name) => updateDecisionPointName(p.id, name)}
                      />
                    ))}

                    <div className="rounded-xl border border-dashed border-brand-200 bg-brand-50/40 p-4">
                      <p className="text-sm font-semibold text-foreground">
                        补充互动提示
                      </p>
                      <p className="mt-1 text-[12px] text-foreground-faint">
                        用于加入本病例特有、但不属于既有临床决策点库的开放式讨论；不会写回医学内容库。
                      </p>
                      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                        <select
                          value={customStage}
                          onChange={(event) =>
                            setCustomStage(
                              event.target.value as Exclude<
                                (typeof STAGE_ORDER)[number],
                                "case_summary"
                              >
                            )
                          }
                          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none"
                        >
                          {STAGE_ORDER.filter((stage) => stage !== "case_summary").map(
                            (stage) => (
                              <option key={stage} value={stage}>
                                {STAGE_LABEL[stage]}
                              </option>
                            )
                          )}
                        </select>
                        <input
                          value={customSuggestion}
                          onChange={(event) => setCustomSuggestion(event.target.value)}
                          placeholder="例如：与患者共同讨论脑转移随访计划"
                          className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none placeholder:text-foreground-faint"
                        />
                        <Button
                          variant="secondary"
                          disabled={!customSuggestion.trim()}
                          onClick={() => {
                            addCustomInteractionSuggestion({
                              stage: customStage,
                              content: customSuggestion,
                            });
                            setCustomSuggestion("");
                          }}
                        >
                          添加提示
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {qaDone && (
                <>
                  {/* 7. 结构化病例生成 */}
                  <div
                    id="output"
                    className="scroll-mt-24 rounded-2xl border border-border bg-surface p-5"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">
                        结构化病例生成 · 基础病例与互动问题
                      </p>
                      <Button
                        variant="secondary"
                        onClick={() =>
                          downloadStructuredCaseDocx({
                            projectName,
                            fields,
                            interactionPoints: includedInteractionPoints,
                          })
                        }
                      >
                        <Download size={14} />
                        下载Word病例
                      </Button>
                    </div>
                    <FieldGroup fields={fields} />

                    <div className="mt-6 border-t border-border-soft pt-5">
                      <div className="mb-3">
                        <p className="text-sm font-semibold text-foreground">
                          互动问题
                        </p>
                        <p className="mt-1 text-[12px] text-foreground-faint">
                          已纳入 {includedInteractionPoints.length} 个互动问题，将随基础病例一起进入故事线与 H5。
                        </p>
                      </div>
                      {includedInteractionPoints.length > 0 ? (
                        <div className="flex flex-col gap-3">
                          {includedInteractionPoints.map((point, index) => (
                            <DecisionPointCard
                              key={point.id}
                              point={point}
                              index={index}
                            />
                          ))}
                        </div>
                      ) : (
                        <p className="rounded-lg bg-surface-sunken p-3 text-sm text-foreground-soft">
                          当前没有纳入互动问题；可返回上方“互动问题生成”区域补充或勾选题目。
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={() => router.push("/create/story-outline")}>
                      下一步：互动剧情生成
                      <ArrowRight size={15} />
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
          </div>
        </>
      )}
    </div>
  );
}
