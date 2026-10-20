import type {
  CaseField,
  ClinicalTimelineNode,
  DecisionBranchLibrary,
  TriggeredDecisionPoint,
} from "@/lib/types/case";

function caseText(fields: CaseField[]) {
  return fields
    .map((field) => `${field.label} ${field.value ?? ""}`)
    .join(" ")
    .toLowerCase();
}

function matchedPopulationTags(library: DecisionBranchLibrary, text: string) {
  const signalByTag: Record<string, string[]> = {
    "EGFR 19Del 突变阳性": ["19del", "19缺失", "exon 19"],
    "EGFR L858R 突变阳性": ["l858r"],
    "晚期一线初治": ["一线", "初治"],
    "既往未经 EGFR-TKI 治疗": ["未经egfr-tki", "未接受egfr-tki"],
    "基线伴 CNS 转移": ["脑转移", "cns转移", "颅内转移"],
    "多发远处转移": ["多发转移", "骨转移", "脑转移"],
    "体力状况 PS 0-2": ["ps 0", "ps 1", "ps 2", "ecog 0", "ecog 1", "ecog 2"],
  };
  return library.populationTags
    .filter((tag) => signalByTag[tag.label]?.some((signal) => text.includes(signal)))
    .map((tag) => tag.label);
}

/**
 * 第二环：时间线定位。诊疗阶段是内容归属，并不总等于叙事出现的时刻：
 * 例如“进展后再活检”属于诊断内容，却应插在发现进展后的随访节点。
 */
function locateInsertionNode(
  pointName: string,
  pointStage: TriggeredDecisionPoint["stage"],
  timeline: ClinicalTimelineNode[],
  treatmentNodeUseCount: Map<string, number>
) {
  if (/进展后|再活检/.test(pointName)) {
    return timeline.find((node) => node.stage === "follow_up") ?? timeline.at(-1);
  }
  if (/剂量调整|不良反应|监测/.test(pointName)) {
    return (
      timeline.find((node) => node.stage === "follow_up") ??
      timeline.filter((node) => node.stage === "treatment_course").at(-1)
    );
  }
  if (pointStage === "treatment_course") {
    // 每个治疗节点至多两题；多个治疗节点时按时间线顺序分配，超额题目不进入本病例。
    return timeline
      .filter((node) => node.stage === "treatment_course")
      .find((node) => (treatmentNodeUseCount.get(node.id) ?? 0) < 2);
  }
  return timeline.find((node) => node.stage === pointStage);
}

/**
 * 第一环：从已批准条目（或显式开启的演示库）中检索病例相关的临床决策点。
 * 这里的规则只负责命中与插入定位，不判断哪一个备选方向更好；
 * “已批准/演示开关”过滤必须保留在模型调用之前。
 */
export function matchApprovedDecisionPoints(
  library: DecisionBranchLibrary,
  fields: CaseField[],
  timeline: ClinicalTimelineNode[]
): TriggeredDecisionPoint[] {
  const text = caseText(fields);
  const populationTags = matchedPopulationTags(library, text);

  const treatmentNodeUseCount = new Map<string, number>();
  return library.decisionPoints
    .filter((point) => point.status === "approved" || library.demoEnabled)
    .flatMap((point) => {
      const timelineNode = locateInsertionNode(point.name, point.stage, timeline, treatmentNodeUseCount);
      if (!timelineNode) return [];
      if (timelineNode.stage === "treatment_course") {
        treatmentNodeUseCount.set(
          timelineNode.id,
          (treatmentNodeUseCount.get(timelineNode.id) ?? 0) + 1
        );
      }
      return [{
        id: `trigger-${point.id}-${timelineNode.id}`,
        decisionPointId: point.id,
        decisionPointName: point.name,
        stage: point.stage,
        orientation: point.orientation,
        triggerLabel: `插入：${timelineNode.title}`,
        matchedPopulationTagLabels: populationTags,
        recommendedAlternativeId: "",
        alternatives: point.alternatives,
        feedbackByAlternative: {},
        timelineNodeId: timelineNode.id,
        timelineNodeLabel: timelineNode.title,
        insertionReason: `依据病例进程，插入“${timelineNode.title}”节点。`,
      }];
    });
}
