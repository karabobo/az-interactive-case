/**
 * Mock AI 管线——demo阶段没有真实模型/知识库接入，用带延迟的假异步函数模拟。
 * 保持函数签名贴近真实调用契约，后续接真实API时只替换实现，不改调用方。
 */
import { findLibraryByProduct } from "@/lib/mock/decision-library";
import { buildClinicalTimeline } from "@/lib/interaction/clinical-timeline";
import { matchApprovedDecisionPoints } from "@/lib/interaction/decision-point-matching";
import { STAGE_LABEL, STAGE_ORDER } from "@/lib/types/case";
import {
  SAMPLE_STORY_ACTS,
  SAMPLE_TRIGGERED_DECISION_POINTS,
} from "@/lib/mock/sample-case";
import type {
  CaseField,
  ClinicalTimelineNode,
  ProductInference,
  StoryAct,
  TriggeredDecisionPoint,
} from "@/lib/types/case";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 步骤①-3「提取信息」已接入真实模型调用（见 app/api/extract/route.ts + lib/ai/stream-client.ts），
// 不再需要这里的mock版本。互动问题生成/故事大纲/渲染H5仍是mock，留待后续接入。

export interface OutlineResult {
  inference: ProductInference;
  clinicalTimeline: ClinicalTimelineNode[];
  triggeredDecisionPoints: TriggeredDecisionPoint[];
  degraded: boolean;
}

/**
 * 产品改为上传前人工选择（场景选择的第4步，可选），疾病领域由所选产品对应的库
 * 1:1带出，不需要用户单独选。这一步职责是"确认匹配库 + 检索决策点"
 * （ADR-0002/0007的检索部分不变）。
 */
export async function inferAndRetrieve(
  product: string | null,
  fields: CaseField[]
): Promise<OutlineResult> {
  await wait(1800);
  const clinicalTimeline = buildClinicalTimeline(fields);

  if (!product) {
    return {
      inference: {
        product: null,
        diseaseArea: null,
        confidence: "none",
        matchedLibraryId: null,
        reasoning: "尚未选择产品，请返回「场景选择」步骤",
      },
      clinicalTimeline,
      triggeredDecisionPoints: [],
      degraded: true,
    };
  }

  const library = findLibraryByProduct(product);
  if (!library) {
    return {
      inference: {
        product,
        diseaseArea: null,
        confidence: "none",
        matchedLibraryId: null,
        reasoning: `未找到「${product}」对应的决策分支点库，按ADR-0005降级为静态病例展示`,
      },
      clinicalTimeline,
      triggeredDecisionPoints: [],
      degraded: true,
    };
  }

  const reviewSummary = {
    total: library.decisionPoints.length,
    approved: library.decisionPoints.filter((point) => point.status === "approved")
      .length,
    pendingReview: library.decisionPoints.filter(
      (point) => point.status === "pending_review"
    ).length,
    demoEnabled: library.demoEnabled === true,
  };

  // ADR-0008：候选内容可以被定位和展示，但没有任何已批准条目时，
  // 必须在这里截断，不能生成互动题或反馈文案。
  if (reviewSummary.approved === 0 && !reviewSummary.demoEnabled) {
    return {
      inference: {
        product: library.product,
        diseaseArea: library.diseaseArea,
        confidence: "high",
        matchedLibraryId: library.id,
        reviewSummary,
        reasoning: `已匹配「${library.product} · ${library.diseaseArea}」候选库：暂无可用于生成互动问题的已批准条目`,
      },
      clinicalTimeline,
      triggeredDecisionPoints: [],
      degraded: true,
    };
  }

  // 博瑞纳保留既有的高保真示例反馈；其余已批准库走通用的“命中→时间线插入”管线。
  if (library.id !== "lib-boruina-nsclc") {
    const triggered = matchApprovedDecisionPoints(library, fields, clinicalTimeline);
    return {
      inference: {
        product,
        diseaseArea: library.diseaseArea,
        confidence: "high",
        matchedLibraryId: library.id,
        reviewSummary,
        reasoning: triggered.length
          ? `已匹配「${product} · ${library.diseaseArea}」决策分支点库，并将 ${triggered.length} 个决策点插入病例时间线`
          : `已匹配「${product} · ${library.diseaseArea}」决策分支点库，但病例中没有可插入的已批准决策点`,
      },
      clinicalTimeline,
      triggeredDecisionPoints: triggered,
      degraded: triggered.length === 0,
    };
  }

  // 把库定义的 alternatives 挂回 mock 触发结果（真实实现里这一步由检索模块完成）
  const triggered = SAMPLE_TRIGGERED_DECISION_POINTS.map((t) => {
    const dp = library.decisionPoints.find((d) => d.id === t.decisionPointId);
    const timelineNode = clinicalTimeline.find((node) => node.stage === t.stage);
    return {
      ...t,
      alternatives: dp?.alternatives ?? [],
      orientation: dp?.orientation,
      timelineNodeId: timelineNode?.id,
      timelineNodeLabel: timelineNode?.title,
      insertionReason: timelineNode
        ? `该决策点在“${timelineNode.title}”节点出现。`
        : undefined,
    };
  });

  return {
    inference: {
      product: library.product,
      diseaseArea: library.diseaseArea,
      confidence: "high",
      matchedLibraryId: library.id,
      reviewSummary,
      reasoning:
        "诊断字段含「ALK融合阳性」「肺腺癌」，治疗方案字段含「ALK-TKI」，与所选库的适应症定义匹配",
    },
    clinicalTimeline,
    triggeredDecisionPoints: triggered,
    degraded: false,
  };
}

/**
 * 步骤②「短剧故事线大纲」：把步骤①产出的结构化字段 + 互动问题（决策点）
 * 改写为场景化叙事（幕/镜头/对话），不重新做产品判断或决策点检索。
 */
export async function generateStoryActs(
  fields: CaseField[],
  triggeredDecisionPoints: TriggeredDecisionPoint[]
): Promise<StoryAct[]> {
  await wait(2000);
  if (fields.length === 0) {
    throw new Error("还没有结构化病例字段，无法生成故事线");
  }
  if (triggeredDecisionPoints.length === 0) {
    // 对应ADR-0005降级：无互动问题时，仍可生成不含决策点的纯叙事故事线
    return SAMPLE_STORY_ACTS.map((act) => ({ ...act, decisionPointIds: [] }));
  }
  // 故事台词仍是示例桩，但互动内容必须以用户最终“纳入”的题目为准，
  // 包括用户补充的开放式互动提示。
  const baseActs = SAMPLE_STORY_ACTS.map((act) => ({
    ...act,
    decisionPointIds: triggeredDecisionPoints
      .filter((point) => point.stage === act.stage)
      .map((point) => point.id),
  }));
  const coveredStages = new Set(baseActs.map((act) => act.stage));
  const supplementaryActs = STAGE_ORDER.filter(
    (stage) =>
      stage !== "case_summary" &&
      !coveredStages.has(stage) &&
      triggeredDecisionPoints.some((point) => point.stage === stage)
  ).map((stage) => ({
    id: `act-${stage}`,
    order: 0,
    stage,
    title: `补充幕 · ${STAGE_LABEL[stage]}`,
    sceneDirection: "根据病例时间线新增的互动提示节点。",
    dialogue: [
      {
        speaker: "系统提示",
        line: "请结合当前病例信息，完成下面的互动讨论。",
      },
    ],
    decisionPointIds: triggeredDecisionPoints
      .filter((point) => point.stage === stage)
      .map((point) => point.id),
  }));

  return [...baseActs, ...supplementaryActs]
    .sort((a, b) => STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage))
    .map((act, index) => ({ ...act, order: index }));
}

export interface RenderResult {
  previewUrl: string;
  qrDataUrl: string;
}

/**
 * 组装互动H5预览。本版本不调用外部渲染服务；已编排的剧情、人物选择与互动题
 * 由前端实时组成可操作的手机端预览。
 */
export async function renderInteractiveH5(): Promise<RenderResult> {
  await wait(450);
  return {
    previewUrl: "/mock-preview",
    qrDataUrl: "",
  };
}

export function resetRenderAttempts() {
  // 保留动作入口，兼容现有 reset 流程；预览组装没有可重置的远端状态。
}

export interface PreReviewSubmitResult {
  submittedAt: string;
}

/** AI预审是独立系统（用户已确认，本版本不实现），这里只是提交对接桩 */
export async function submitToPreReview(): Promise<PreReviewSubmitResult> {
  await wait(900);
  return { submittedAt: new Date().toISOString() };
}
