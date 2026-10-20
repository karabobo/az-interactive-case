/**
 * 数据模型依据：CONTEXT.md + docs/adr/0001,0002,0003,0004,0005,0006,0007,0008
 * 不是参考站 havas.imatrix.top 的 items[] 结构——那套已被这些ADR取代。
 */

// ADR-0001：通用诊疗路径，不要求每个病例覆盖全部阶段
// 注：原ADR-0001为5步（就诊/诊断/治疗方案选择/品牌选择/随访），产品方经多轮live指示
// 改为现在这6个并列阶段：
//   就诊 → 相关检查（原本挂在"诊断"下的体格检查/实验室检查/影像学检查，现独立为
//   与"诊断"并列的一个阶段，不再是诊断的子项）→ 诊断（收窄为仅主要诊断/次要诊断/诊断依据，
//   不再包含检查类内容）→ 治疗经过（合并原"治疗方案选择"+"品牌选择"）→ 随访 →
//   病例小结（与随访并列的独立阶段，不是随访的子项）。
// 此处ADR-0001原本的阶段划分已被这些live指示覆盖。
export type DiagnosticStage =
  | "visit"
  | "relevant_exams"
  | "diagnosis"
  | "treatment_course"
  | "follow_up"
  | "case_summary";

export const STAGE_ORDER: DiagnosticStage[] = [
  "visit",
  "relevant_exams",
  "diagnosis",
  "treatment_course",
  "follow_up",
  "case_summary",
];

export const STAGE_LABEL: Record<DiagnosticStage, string> = {
  visit: "就诊",
  relevant_exams: "相关检查",
  diagnosis: "诊断",
  treatment_course: "治疗经过",
  follow_up: "随访",
  case_summary: "病例小结",
};

// ADR-0003：AI补全允许，但需标记来源；发布定稿前会被抹除
export type FieldProvenance = "original" | "ai_completed";

export interface CaseField {
  id: string;
  stage: DiagnosticStage;
  label: string;
  value: string | null;
  provenance: FieldProvenance;
}

// ADR-0004：图片不做AI理解，检查类型与报告结果均人工录入
export const EXAM_TYPE_OPTIONS = ["X光", "CT", "MRI", "皮肤镜", "超声", "病理切片"] as const;
export type ExamType = (typeof EXAM_TYPE_OPTIONS)[number];

export interface CaseImage {
  id: string;
  fileName: string;
  previewUrl: string; // 本地 object URL，仅用于页面展示
  examType: ExamType | null;
  reportText: string | null;
}

// ADR-0006：杠杆点（强化价值）/ 防御点（化解顾虑）/ 中性
export type Orientation = "leverage" | "defense" | "neutral";

export const ORIENTATION_LABEL: Record<Orientation, string> = {
  leverage: "杠杆点",
  defense: "防御点",
  neutral: "中性",
};

// ADR-0007：备选方向是具体做法/路径，不是人群标签本身
export interface AlternativeDirection {
  id: string;
  content: string; // 方向内容
  rationale: string; // 依据（可含具体证据数字，ADR-0008）
  applicableCondition: string; // 适用条件，自然语言
  /** 历史导入字段；不再作为产品界面中的沟通定位展示。 */
  orientation?: Orientation;
}

// ADR-0008：状态 + 最后核实日期治理时效性；只有 approved 参与检索
export type DecisionPointStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "deprecated";

export const STATUS_LABEL: Record<DecisionPointStatus, string> = {
  draft: "草稿",
  pending_review: "待审核",
  approved: "已批准",
  deprecated: "已废弃",
};

// ADR-0006：问答分类是主标签，用于库内容维护/检索，不参与运行时匹配
export interface QnaCategory {
  l1: string;
  l2: string;
  l3: string;
}

// ADR-0007：库→决策点→备选方向，只有两层真正嵌套
export interface DecisionPoint {
  id: string;
  name: string;
  stage: DiagnosticStage;
  qnaCategory: QnaCategory;
  /** 杠杆点/防御点/中性属于临床决策点整体，而非某一个备选方向。 */
  orientation?: Orientation;
  status: DecisionPointStatus;
  lastVerifiedAt: string | null;
  allowMultiTrigger: boolean; // 同一诊疗阶段允许多次触发，不设上限
  alternatives: AlternativeDirection[]; // 2-3个
}

// ADR-0007：库级别共享标签，由备选方向的"适用条件"引用
export interface PopulationTag {
  id: string;
  label: string;
}

// ADR-0002：医学团队按 产品×疾病领域 预建
export interface DecisionBranchLibrary {
  id: string;
  product: string;
  diseaseArea: string;
  populationTags: PopulationTag[];
  decisionPoints: DecisionPoint[];
  /** 演示环境可临时放行待审核候选内容；不改变原始医学审核状态。 */
  demoEnabled?: boolean;
}

// 病例内被实际匹配触发的一个决策点实例
export interface TriggeredDecisionPoint {
  id: string;
  decisionPointId: string;
  decisionPointName: string;
  stage: DiagnosticStage;
  orientation?: Orientation;
  triggerLabel: string | null; // 多次触发时的说明，如"第2次触发：耐药进展后"
  matchedPopulationTagLabels: string[];
  recommendedAlternativeId: string; // 预留给未来的用户选择结果；当前不做AI推荐
  selectedAlternativeId?: string; // 学员/用户在互动剧情中实际选择的方向
  alternatives: AlternativeDirection[];
  feedbackByAlternative: Record<string, string>; // 兼容既有数据；当前页面不展示AI反馈
  /** 命中题目在本病例诊疗时间线中的插入位置，而非仅按诊疗阶段粗略分组。 */
  timelineNodeId?: string;
  timelineNodeLabel?: string;
  insertionReason?: string;
  /** 用户在生成前的编排选择；未设置时默认为纳入，兼容既有样例。 */
  included?: boolean;
  /** 用户补充的互动提示不属于医学库命中，不写回决策分支点库。 */
  source?: "library_match" | "custom_suggestion";
}

/**
 * 病例内可承载互动题的诊疗时间线节点。它由已提取的病例字段归纳而来，
 * 与“决策点是否命中”是两个独立结果。
 */
export interface ClinicalTimelineNode {
  id: string;
  stage: Exclude<DiagnosticStage, "case_summary">;
  title: string;
  occurredAt: string | null;
  summary: string;
  sourceFieldIds: string[];
}

// 短剧故事线大纲的一幕——把结构化病例+互动问题（决策点）改写为场景化叙事
export interface StoryDialogueLine {
  speaker: string; // "患者" / "主治医生" 等
  line: string;
}

export interface StoryAct {
  id: string;
  order: number;
  stage: DiagnosticStage;
  title: string; // "幕1 · 患者信息" 风格
  sceneDirection: string; // 镜头描述
  dialogue: StoryDialogueLine[];
  decisionPointIds: string[]; // 关联本幕出现的互动问题（TriggeredDecisionPoint.id）
  transition?: string; // 与下一幕的连续转场说明
}

/**
 * 产品/疾病领域判断结果。
 * 注：ADR-0005原设计是AI自动判断，不要求人工指定；产品方在实际推进中改为
 * 上传前人工选择（与应用场景一起构成上传前的3步选择），AI这一步改为"确认匹配库"
 * 而非"从零推断"。字段结构保留，语义从"AI推断"调整为"人工选择+库匹配确认"。
 */
export interface ProductInference {
  product: string | null;
  diseaseArea: string | null;
  confidence: "high" | "medium" | "low" | "none";
  matchedLibraryId: string | null;
  reasoning: string;
  /** 候选库治理摘要。待审核条目可展示给内容团队，但不得进入互动题生成。 */
  reviewSummary?: {
    total: number;
    approved: number;
    pendingReview: number;
    demoEnabled: boolean;
  };
}

// 场景选择：与参考站 havas.imatrix.top 的文案/选项完全一致
export type UseCaseScenario =
  | "clinical_simulation"
  | "academic_promotion"
  | "teaching_rounds"
  | "field_progress"
  | "science_education";

export const SCENARIO_LABEL: Record<UseCaseScenario, string> = {
  clinical_simulation: "临床模拟诊疗",
  academic_promotion: "学术推广",
  teaching_rounds: "教学查房",
  field_progress: "领域进展",
  science_education: "科普教育",
};

// 疾病类型：宽泛分类，纯描述字段，不参与决策分支点库路由（路由由"产品"决定）
export type DiseaseType = "tumor" | "rare" | "chronic" | "respiratory_digestive";

export const DISEASE_TYPE_LABEL: Record<DiseaseType, string> = {
  tumor: "肿瘤病例",
  rare: "罕见病例",
  chronic: "慢病管理病例",
  respiratory_digestive: "呼吸消化病例",
};

export type AudienceType = "HCP" | "医药代表" | "患者/家属";

export type DocumentParseStatus = "unsupported" | "parsing" | "parsed" | "error";

export interface CaseDocument {
  id: string; // 服务端文件记录 ID；用于按当前账号权限下载
  fileName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  rawText: string | null; // 服务端解析出的原文（支持 .docx / 可检索 PDF）
  parseStatus: DocumentParseStatus;
  parseError: string | null;
}

export interface CaseInput {
  scenario: UseCaseScenario | null;
  audience: AudienceType | null;
  diseaseType: DiseaseType | null; // 宽泛分类，纯描述，不参与库路由
  // 产品：人工指定，决定检索哪个决策分支点库；疾病领域由所选产品自动带出（1:1），不再单独选择
  product: string | null;
  caseDocument: CaseDocument | null;
  referenceMaterials: { fileName: string }[];
  images: CaseImage[];
  freeTextNotes: string;
}

// 形象选择——固定素材，不走生成式调用
export type DoctorAvatar = "doctor_male" | "doctor_female";
export type PatientAvatar = "patient_male" | "patient_female";
export type TemplateId = "general" | "brand";

// AI预审是独立系统，这里只做提交/轮询状态机的对接桩
export type PreReviewStatus =
  | "not_submitted"
  | "pending"
  | "approved"
  | "rejected";

export type AsyncStatus = "idle" | "loading" | "success" | "error";

/** 持久化的病例项目内容；浏览器临时预览地址不进入数据库。 */
export interface CaseProjectSnapshot {
  selectedModelId: string;
  input: Omit<CaseInput, "images"> & {
    images: Array<Omit<CaseImage, "previewUrl">>;
  };
  fields: CaseField[];
  completenessNotes: string[];
  baseCaseConfirmed: boolean;
  inference: ProductInference | null;
  clinicalTimeline: ClinicalTimelineNode[];
  triggeredDecisionPoints: TriggeredDecisionPoint[];
  degraded: boolean;
  storyActs: StoryAct[];
  doctorAvatar: DoctorAvatar | null;
  patientAvatar: PatientAvatar | null;
  template: TemplateId | null;
}

export interface CaseWizardState {
  projectId: string | null;
  projectName: string;
  projectUpdatedAt: string | null;
  persistenceStatus: AsyncStatus;
  persistenceError: string | null;
  selectedModelId: string; // 模型选择器当前选中项（Qwen/Gemini/GPT，过渡期统一走同一后台）
  extractionStreamText: string; // 提取信息时的实时流式原始输出，用于逐字预览
  storyStreamText: string; // 互动剧情生成时的实时流式原始输出
  input: CaseInput;
  fields: CaseField[];
  completenessNotes: string[]; // 必选项检查产出的提示，不阻断流程
  baseCaseConfirmed: boolean; // 步骤①-5「生成基础病例」的确认状态
  inference: ProductInference | null;
  clinicalTimeline: ClinicalTimelineNode[];
  triggeredDecisionPoints: TriggeredDecisionPoint[]; // 步骤①-6「互动问题生成」产出
  degraded: boolean; // ADR-0005：无匹配时降级为静态展示，不算失败
  storyActs: StoryAct[]; // 步骤②「短剧故事线大纲」产出：把互动问题改写为场景化叙事
  doctorAvatar: DoctorAvatar | null;
  patientAvatar: PatientAvatar | null;
  template: TemplateId | null;
  preReview: { status: PreReviewStatus; submittedAt: string | null };
  status: {
    extraction: AsyncStatus;
    qa: AsyncStatus; // 互动问题生成（决策分支点库检索+匹配）
    story: AsyncStatus; // 短剧故事线大纲生成
    render: AsyncStatus;
  };
  errors: {
    extraction: string | null;
    qa: string | null;
    story: string | null;
    render: string | null;
  };
}
