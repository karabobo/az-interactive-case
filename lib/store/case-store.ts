"use client";

import { create } from "zustand";
import type {
  AudienceType,
  CaseWizardState,
  CaseProjectSnapshot,
  DiseaseType,
  DoctorAvatar,
  DiagnosticStage,
  ExamType,
  PatientAvatar,
  TemplateId,
  UseCaseScenario,
} from "@/lib/types/case";
import {
  inferAndRetrieve,
  renderInteractiveH5,
  resetRenderAttempts,
  submitToPreReview,
} from "@/lib/ai/mock-pipeline";
import {
  streamExtraction,
  streamInteractiveStory,
  parseModelJson,
} from "@/lib/ai/stream-client";
import { DEFAULT_MODEL_ID } from "@/lib/ai/model-catalog";
import type { CaseField, StoryAct } from "@/lib/types/case";

interface CaseWizardActions {
  setProjectName: (name: string) => void;
  saveProject: () => Promise<void>;
  loadProject: (project: { id: string; name: string; updatedAt: string; snapshot: CaseProjectSnapshot }) => void;
  setSelectedModelId: (id: string) => void;
  setScenario: (scenario: UseCaseScenario) => void;
  setAudience: (audience: AudienceType) => void;
  setDiseaseType: (diseaseType: DiseaseType) => void;
  setProduct: (product: string) => void;
  uploadCaseDocument: (file: File) => Promise<void>;
  removeCaseDocument: () => void;
  addReferenceMaterial: (fileName: string) => void;
  removeReferenceMaterial: (fileName: string) => void;
  addImages: (files: File[]) => void;
  updateImageExamType: (id: string, examType: ExamType) => void;
  updateImageReportText: (id: string, text: string) => void;
  removeImage: (id: string) => void;
  setFreeTextNotes: (text: string) => void;
  updateFieldValue: (id: string, value: string) => void;

  runExtraction: () => Promise<void>;
  confirmBaseCase: () => void;
  runQaGeneration: () => Promise<void>;
  setDecisionPointIncluded: (id: string, included: boolean) => void;
  updateDecisionPointName: (id: string, name: string) => void;
  selectInteractionAlternative: (pointId: string, alternativeId: string) => void;
  addCustomInteractionSuggestion: (params: {
    stage: Exclude<DiagnosticStage, "case_summary">;
    content: string;
  }) => void;
  runStoryOutline: () => Promise<void>;
  runRender: () => Promise<void>;
  retryRender: () => Promise<void>;

  setDoctorAvatar: (a: DoctorAvatar) => void;
  setPatientAvatar: (a: PatientAvatar) => void;
  setTemplate: (t: TemplateId) => void;

  submitPreReview: () => Promise<void>;

  reset: () => void;
}

const initialState: CaseWizardState = {
  projectId: null,
  projectName: "未命名病例",
  projectUpdatedAt: null,
  persistenceStatus: "idle",
  persistenceError: null,
  selectedModelId: DEFAULT_MODEL_ID,
  extractionStreamText: "",
  storyStreamText: "",
  input: {
    scenario: null,
    audience: null,
    diseaseType: null,
    product: null,
    caseDocument: null,
    referenceMaterials: [],
    images: [],
    freeTextNotes: "",
  },
  fields: [],
  completenessNotes: [],
  baseCaseConfirmed: false,
  inference: null,
  clinicalTimeline: [],
  triggeredDecisionPoints: [],
  degraded: false,
  storyActs: [],
  doctorAvatar: null,
  patientAvatar: null,
  template: null,
  preReview: { status: "not_submitted", submittedAt: null },
  status: { extraction: "idle", qa: "idle", story: "idle", render: "idle" },
  errors: { extraction: null, qa: null, story: null, render: null },
};

export const useCaseStore = create<CaseWizardState & CaseWizardActions>(
  (set, get) => ({
    ...initialState,

    setProjectName: (name) => set({ projectName: name }),
    saveProject: async () => {
      const state = get();
      const snapshot: CaseProjectSnapshot = {
        selectedModelId: state.selectedModelId,
        input: {
          ...state.input,
          images: state.input.images.map(({ previewUrl: _previewUrl, ...image }) => image),
        },
        fields: state.fields,
        completenessNotes: state.completenessNotes,
        baseCaseConfirmed: state.baseCaseConfirmed,
        inference: state.inference,
        clinicalTimeline: state.clinicalTimeline,
        triggeredDecisionPoints: state.triggeredDecisionPoints,
        degraded: state.degraded,
        storyActs: state.storyActs,
        doctorAvatar: state.doctorAvatar,
        patientAvatar: state.patientAvatar,
        template: state.template,
      };
      set({ persistenceStatus: "loading", persistenceError: null });
      try {
        const response = await fetch("/api/cases", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: state.projectId, name: state.projectName, snapshot }),
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "病例保存失败");
        set({
          projectId: payload.project.id,
          projectName: payload.project.name,
          projectUpdatedAt: payload.project.updatedAt,
          persistenceStatus: "success",
        });
      } catch (error) {
        set({
          persistenceStatus: "error",
          persistenceError: error instanceof Error ? error.message : "病例保存失败",
        });
      }
    },
    loadProject: (project) => {
      const snapshot = project.snapshot;
      // 已保存的项目不保存瞬时 loading 状态，但其结构化内容、互动题和剧情本身就是
      // 对应步骤已完成的事实。恢复项目时据此重建可继续编辑的完成状态，不能要求用户重跑。
      const extractionCompleted = snapshot.fields.length > 0;
      const interactionCompleted = snapshot.triggeredDecisionPoints.length > 0 || snapshot.degraded;
      const storyCompleted = snapshot.storyActs.length > 0;
      set({
        projectId: project.id,
        projectName: project.name,
        projectUpdatedAt: project.updatedAt,
        persistenceStatus: "success",
        persistenceError: null,
        selectedModelId: snapshot.selectedModelId,
        input: {
          ...snapshot.input,
          images: snapshot.input.images.map((image) => ({ ...image, previewUrl: "" })),
        },
        fields: snapshot.fields,
        completenessNotes: snapshot.completenessNotes,
        baseCaseConfirmed: snapshot.baseCaseConfirmed,
        inference: snapshot.inference,
        clinicalTimeline: snapshot.clinicalTimeline,
        triggeredDecisionPoints: snapshot.triggeredDecisionPoints,
        degraded: snapshot.degraded,
        storyActs: snapshot.storyActs,
        doctorAvatar: snapshot.doctorAvatar,
        patientAvatar: snapshot.patientAvatar,
        template: snapshot.template,
        extractionStreamText: "",
        storyStreamText: "",
        preReview: { status: "not_submitted", submittedAt: null },
        status: {
          extraction: extractionCompleted ? "success" : "idle",
          qa: interactionCompleted ? "success" : "idle",
          story: storyCompleted ? "success" : "idle",
          render: "idle",
        },
        errors: { extraction: null, qa: null, story: null, render: null },
      });
    },

    setSelectedModelId: (id) => set({ selectedModelId: id }),

    setScenario: (scenario) =>
      set((s) => ({ input: { ...s.input, scenario } })),
    setAudience: (audience) =>
      set((s) => ({ input: { ...s.input, audience } })),
    // 切换疾病类型时清空药品选择——药品目录按疾病类型分组，旧选择可能不再适用
    setDiseaseType: (diseaseType) =>
      set((s) => ({ input: { ...s.input, diseaseType, product: null } })),
    setProduct: (product) =>
      set((s) => ({ input: { ...s.input, product } })),
    // 文件上传、存储与文本解析均在服务端执行；原始文件按当前账号隔离保存。
    uploadCaseDocument: async (file) => {
      set((s) => ({
        input: {
          ...s.input,
          caseDocument: {
            id: "uploading",
            fileName: file.name,
            mimeType: file.type || "application/octet-stream",
            size: file.size,
            uploadedAt: new Date().toISOString(),
            rawText: null,
            parseStatus: "parsing",
            parseError: null,
          },
        },
      }));
      try {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch("/api/uploads/case", { method: "POST", body: formData });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "文件上传失败");
        set((s) => ({
          input: {
            ...s.input,
            caseDocument: payload.document,
          },
        }));
      } catch (e) {
        set((s) => ({
          input: {
            ...s.input,
            caseDocument: {
              id: "",
              fileName: file.name,
              mimeType: file.type || "application/octet-stream",
              size: file.size,
              uploadedAt: new Date().toISOString(),
              rawText: null,
              parseStatus: "error",
              parseError: e instanceof Error ? e.message : "文档解析失败",
            },
          },
        }));
      }
    },
    removeCaseDocument: () =>
      set((s) => ({ input: { ...s.input, caseDocument: null } })),

    addReferenceMaterial: (fileName) =>
      set((s) => ({
        input: {
          ...s.input,
          referenceMaterials: [...s.input.referenceMaterials, { fileName }],
        },
      })),
    removeReferenceMaterial: (fileName) =>
      set((s) => ({
        input: {
          ...s.input,
          referenceMaterials: s.input.referenceMaterials.filter(
            (m) => m.fileName !== fileName
          ),
        },
      })),

    // ADR-0004：图片仅作素材保留，不做AI图像理解；检查类型/报告结果均人工录入
    addImages: (files) =>
      set((s) => ({
        input: {
          ...s.input,
          images: [
            ...s.input.images,
            ...files.map((f) => ({
              id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              fileName: f.name,
              previewUrl: URL.createObjectURL(f),
              examType: null,
              reportText: null,
            })),
          ],
        },
      })),
    updateImageExamType: (id, examType) =>
      set((s) => ({
        input: {
          ...s.input,
          images: s.input.images.map((img) =>
            img.id === id ? { ...img, examType } : img
          ),
        },
      })),
    updateImageReportText: (id, text) =>
      set((s) => ({
        input: {
          ...s.input,
          images: s.input.images.map((img) =>
            img.id === id ? { ...img, reportText: text } : img
          ),
        },
      })),
    removeImage: (id) =>
      set((s) => {
        const target = s.input.images.find((img) => img.id === id);
        if (target) URL.revokeObjectURL(target.previewUrl);
        return {
          input: {
            ...s.input,
            images: s.input.images.filter((img) => img.id !== id),
          },
        };
      }),

    setFreeTextNotes: (text) =>
      set((s) => ({ input: { ...s.input, freeTextNotes: text } })),

    updateFieldValue: (id, value) =>
      set((s) => ({
        fields: s.fields.map((f) =>
          f.id === id ? { ...f, value, provenance: "original" } : f
        ),
      })),

    // 步骤①-3 提取信息——真实调用LLM（teamorouter），流式返回后解析为结构化字段
    runExtraction: async () => {
      const { input, selectedModelId } = get();
      const rawText = input.caseDocument?.rawText;

      if (!rawText) {
        set((s) => ({
          status: { ...s.status, extraction: "error" },
          errors: {
            ...s.errors,
            extraction:
              "当前仅支持解析 .docx 的原文内容用于AI提取，请上传 .docx 格式的病例文档",
          },
        }));
        return;
      }

      set((s) => ({
        status: { ...s.status, extraction: "loading" },
        errors: { ...s.errors, extraction: null },
        extractionStreamText: "",
      }));

      try {
        const fullText = await streamExtraction(
          {
            rawText,
            scenario: input.scenario,
            audience: input.audience,
            diseaseType: input.diseaseType,
            product: input.product,
            modelId: selectedModelId,
          },
          (textSoFar) => set({ extractionStreamText: textSoFar })
        );

        const parsed = parseModelJson<{
          items: Array<{
            stage: CaseField["stage"];
            label: string;
            value: string | null;
            provenance: CaseField["provenance"];
          }>;
          completenessNotes: string[];
        }>(fullText);

        const fields: CaseField[] = parsed.items.map((item, i) => ({
          id: `f-${Date.now()}-${i}`,
          stage: item.stage,
          label: item.label,
          value: item.value,
          provenance: item.provenance === "ai_completed" ? "ai_completed" : "original",
        }));

        set((s) => ({
          fields,
          completenessNotes: parsed.completenessNotes ?? [],
          status: { ...s.status, extraction: "success" },
        }));
      } catch (e) {
        set((s) => ({
          status: { ...s.status, extraction: "error" },
          errors: {
            ...s.errors,
            extraction: e instanceof Error ? e.message : "提取失败",
          },
        }));
      }
    },

    // 步骤①-5 生成基础病例：确认必选项检查后的字段作为基础病例，供下一步检索使用
    confirmBaseCase: () => set({ baseCaseConfirmed: true }),

    // 步骤①-6 互动问题生成：决策分支点库检索 + 匹配（ADR-0002/0007）
    runQaGeneration: async () => {
      set((s) => ({
        status: { ...s.status, qa: "loading" },
        errors: { ...s.errors, qa: null },
      }));
      try {
        const { product } = get().input;
        const { fields } = get();
        const result = await inferAndRetrieve(product, fields);
        set((s) => ({
          inference: result.inference,
          clinicalTimeline: result.clinicalTimeline,
          triggeredDecisionPoints: result.triggeredDecisionPoints,
          degraded: result.degraded,
          status: { ...s.status, qa: "success" },
        }));
      } catch (e) {
        set((s) => ({
          status: { ...s.status, qa: "error" },
          errors: {
            ...s.errors,
            qa: e instanceof Error ? e.message : "生成失败",
          },
        }));
      }
    },

    // 用户编排只作用于当前病例，不回写医学团队维护的决策分支点库。
    setDecisionPointIncluded: (id, included) =>
      set((s) => ({
        triggeredDecisionPoints: s.triggeredDecisionPoints.map((point) =>
          point.id === id ? { ...point, included } : point
        ),
      })),

    updateDecisionPointName: (id, name) =>
      set((s) => ({
        triggeredDecisionPoints: s.triggeredDecisionPoints.map((point) =>
          point.id === id ? { ...point, decisionPointName: name } : point
        ),
      })),

    selectInteractionAlternative: (pointId, alternativeId) =>
      set((s) => ({
        triggeredDecisionPoints: s.triggeredDecisionPoints.map((point) =>
          point.id === pointId
            ? { ...point, selectedAlternativeId: alternativeId }
            : point
        ),
      })),

    addCustomInteractionSuggestion: ({ stage, content }) => {
      const trimmed = content.trim();
      if (!trimmed) return;
      set((s) => {
        const timelineNode =
          s.clinicalTimeline.find((node) => node.stage === stage) ??
          s.clinicalTimeline.at(-1);
        const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        return {
          triggeredDecisionPoints: [
            ...s.triggeredDecisionPoints,
            {
              id,
              decisionPointId: id,
              decisionPointName: trimmed,
              stage,
              triggerLabel: "用户补充",
              matchedPopulationTagLabels: [],
              recommendedAlternativeId: "",
              alternatives: [],
              feedbackByAlternative: {},
              timelineNodeId: timelineNode?.id,
              timelineNodeLabel: timelineNode?.title,
              insertionReason: timelineNode
                ? `用户指定插入“${timelineNode.title}”节点。`
                : "用户补充的互动提示。",
              included: true,
              source: "custom_suggestion",
            },
          ],
        };
      });
    },

    // 步骤② 短剧故事线大纲：把①的结构化字段+互动问题改写为场景化叙事
    runStoryOutline: async () => {
      set((s) => ({
        status: { ...s.status, story: "loading" },
        errors: { ...s.errors, story: null },
        storyStreamText: "",
      }));
      try {
        const {
          fields,
          triggeredDecisionPoints,
          clinicalTimeline,
          selectedModelId,
        } = get();
        const includedPoints = triggeredDecisionPoints.filter(
          (point) => point.included !== false
        );
        const fullText = await streamInteractiveStory(
          {
            fields,
            timeline: clinicalTimeline,
            interactionPoints: includedPoints,
            modelId: selectedModelId,
          },
          (textSoFar) => set({ storyStreamText: textSoFar })
        );
        const parsed = parseModelJson<{ acts: StoryAct[] }>(fullText);
        const validInteractionIds = new Set(includedPoints.map((point) => point.id));
        const acts = parsed.acts.map((act, index) => ({
          ...act,
          order: index,
          decisionPointIds: act.decisionPointIds.filter((id) =>
            validInteractionIds.has(id)
          ),
        }));
        set((s) => ({
          storyActs: acts,
          status: { ...s.status, story: "success" },
        }));
      } catch (e) {
        set((s) => ({
          status: { ...s.status, story: "error" },
          errors: {
            ...s.errors,
            story: e instanceof Error ? e.message : "生成失败",
          },
        }));
      }
    },

    runRender: async () => {
      set((s) => ({
        status: { ...s.status, render: "loading" },
        errors: { ...s.errors, render: null },
      }));
      try {
        await renderInteractiveH5();
        set((s) => ({ status: { ...s.status, render: "success" } }));
      } catch (e) {
        set((s) => ({
          status: { ...s.status, render: "error" },
          errors: {
            ...s.errors,
            render: e instanceof Error ? e.message : "渲染失败",
          },
        }));
      }
    },
    retryRender: async () => {
      await get().runRender();
    },

    setDoctorAvatar: (a) => set({ doctorAvatar: a }),
    setPatientAvatar: (a) => set({ patientAvatar: a }),
    setTemplate: (t) => set({ template: t }),

    submitPreReview: async () => {
      set((s) => ({ preReview: { ...s.preReview, status: "pending" } }));
      const result = await submitToPreReview();
      set(() => ({
        preReview: { status: "pending", submittedAt: result.submittedAt },
      }));
    },

    reset: () => {
      resetRenderAttempts();
      set(initialState);
    },
  })
);
