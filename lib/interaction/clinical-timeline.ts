import {
  STAGE_LABEL,
  type CaseField,
  type ClinicalTimelineNode,
  type DiagnosticStage,
} from "@/lib/types/case";

const INSERTABLE_STAGES: Exclude<DiagnosticStage, "case_summary">[] = [
  "visit",
  "relevant_exams",
  "diagnosis",
  "treatment_course",
  "follow_up",
];

const NODE_TITLE: Record<Exclude<DiagnosticStage, "case_summary">, string> = {
  visit: "首次就诊",
  relevant_exams: "相关检查结果回报",
  diagnosis: "明确诊断",
  treatment_course: "治疗决策与实施",
  follow_up: "随访与疗效评估",
};

const DATE_PATTERN = /(?:19|20)\d{2}[年./-]\d{1,2}(?:[月./-]\d{1,2}[日号]?)?/;

function treatmentTimelineNodes(fields: CaseField[]): ClinicalTimelineNode[] {
  const timelineFields = fields.filter(
    (field) =>
      field.stage === "treatment_course" &&
      field.value?.trim() &&
      (field.label.includes("治疗节点") || field.label.includes("治疗时间线") || DATE_PATTERN.test(field.value))
  );
  if (timelineFields.length === 0) return [];

  const events = timelineFields.flatMap((field) => {
    const items = field.label.includes("治疗节点")
      ? [field.value ?? ""]
      : (field.value ?? "").split(/\n|；|(?=(?:19|20)\d{2}[年./-]\d{1,2})/);
    return items
      .map((item) => item.trim())
      .filter((item) => item && (field.label.includes("治疗节点") || DATE_PATTERN.test(item)))
      .map((item) => ({ field, item }));
  });

  return events.map(({ field, item }, index) => ({
    id: `timeline-treatment-${index + 1}`,
    stage: "treatment_course",
    title: `治疗节点 ${index + 1}`,
    occurredAt: item.match(DATE_PATTERN)?.[0] ?? null,
    summary: item,
    sourceFieldIds: [field.id],
  }));
}

/**
 * 从结构化字段构建病例时间线。当前提取结果不含统一的事件表，因此先用五个
 * 可插题诊疗环节形成稳定节点；一旦治疗字段中含日期，就把最早日期显示为该节点时间。
 */
export function buildClinicalTimeline(fields: CaseField[]): ClinicalTimelineNode[] {
  return INSERTABLE_STAGES.flatMap((stage) => {
    if (stage === "treatment_course") {
      const datedNodes = treatmentTimelineNodes(fields);
      if (datedNodes.length > 0) return datedNodes;
    }
    const sourceFields = fields.filter(
      (field) => field.stage === stage && field.value?.trim()
    );
    if (sourceFields.length === 0) return [];

    const sourceText = sourceFields
      .map((field) => `${field.label}：${field.value}`)
      .join("；");
    const date = sourceText.match(DATE_PATTERN)?.[0] ?? null;

    return [{
      id: `timeline-${stage}`,
      stage,
      title: NODE_TITLE[stage],
      occurredAt: date,
      summary: `${STAGE_LABEL[stage]}：${sourceFields
        .slice(0, 2)
        .map((field) => field.value)
        .join("；")}`,
      sourceFieldIds: sourceFields.map((field) => field.id),
    }];
  });
}
