/**
 * Mock决策分支点库——精简自 /Users/karabobo/Documents/决策分支点库_示例_博瑞纳英立达.md
 * 真实库由医学团队维护并审核（ADR-0002），建库本身不在MVP范围内。
 * 全部内容标注"待审核"来源示例，此处固定为 approved 以便demo跑通检索。
 */
import type { DecisionBranchLibrary } from "@/lib/types/case";
import { TARCEVA_EGFRM_CANDIDATE_LIBRARY } from "@/lib/mock/tarceva-egfrm-decision-library";

export const MOCK_LIBRARIES: DecisionBranchLibrary[] = [
  TARCEVA_EGFRM_CANDIDATE_LIBRARY,
  {
    id: "lib-boruina-nsclc",
    product: "博瑞纳",
    diseaseArea: "ALK+ 非小细胞肺癌",
    populationTags: [
      { id: "pt-brain-untreated", label: "脑转移未经治" },
      { id: "pt-brain-progressed", label: "脑转移已治疗后进展" },
      { id: "pt-poor-condition", label: "身体状况不佳" },
      { id: "pt-financial", label: "经济困难" },
      { id: "pt-low-adherence", label: "依从性低" },
      { id: "pt-tki-progressed", label: "既往靶向治疗后进展（耐药）" },
    ],
    decisionPoints: [
      {
        id: "dp-brain-met-path",
        name: "脑转移状态如何影响治疗路径",
        stage: "treatment_course",
        qnaCategory: { l1: "疾病诊疗知识", l2: "疾病知识", l3: "规范诊疗" },
        status: "approved",
        lastVerifiedAt: "2026-03-01",
        allowMultiTrigger: false,
        alternatives: [
          {
            id: "alt-a",
            content: "直接启动ALK TKI单药一线治疗，不额外做颅内局部干预",
            rationale: "一线首选、指南推荐",
            applicableCondition: "人群标签不含「脑转移未经治」或「脑转移已治疗后进展」（即无脑转移）",
            orientation: "leverage",
          },
          {
            id: "alt-b",
            content: "启动ALK TKI单药，同时重点评估颅内病灶控制能力，必要时联合局部治疗（如放疗）",
            rationale: "独特大环结构，强控脑转移，原始病例反复出现该表述",
            applicableCondition: "人群标签含「脑转移未经治」时优先",
            orientation: "leverage",
          },
          {
            id: "alt-c",
            content: "先处理已知颅内病灶（如既往放疗史）再启动/继续靶向治疗，同时监测颅内进展",
            rationale: "需评估既往局部治疗效果",
            applicableCondition: "人群标签含「脑转移已治疗后进展」时优先",
            orientation: "neutral",
          },
        ],
      },
      {
        id: "dp-relapse-path",
        name: "后线耐药进展后的路径选择",
        stage: "treatment_course",
        qnaCategory: { l1: "产品选择", l2: "竞品分析", l3: "耐药机制" },
        status: "approved",
        lastVerifiedAt: "2026-02-14",
        allowMultiTrigger: true,
        alternatives: [
          {
            id: "alt-a",
            content: "继续序贯下一代靶向药",
            rationale: "依耐药机制检测结果",
            applicableCondition: "耐药检测结果明确指向可序贯靶点",
            orientation: "defense",
          },
          {
            id: "alt-b",
            content: "转为化疗/免疫治疗",
            rationale: "无明确可序贯靶点",
            applicableCondition: "耐药机制未明确或无可序贯靶点",
            orientation: "defense",
          },
        ],
      },
      {
        id: "dp-brand-evidence",
        name: "靶向药物临床获益对比依据",
        stage: "treatment_course",
        qnaCategory: { l1: "产品选择", l2: "竞品分析", l3: "关键证据" },
        status: "approved",
        lastVerifiedAt: "2026-03-01",
        allowMultiTrigger: false,
        alternatives: [
          {
            id: "alt-a",
            content: "以PFS数据为优先呈现",
            rationale: "一线首选、指南推荐，3年PFS超60%",
            applicableCondition: "默认方向，尤其一线初治时",
            orientation: "leverage",
          },
          {
            id: "alt-b",
            content: "以脑转移控制数据为优先呈现",
            rationale: "独特大环结构，强控脑转移",
            applicableCondition: "人群标签含脑转移相关标签时优先",
            orientation: "leverage",
          },
          {
            id: "alt-c",
            content: "以安全性数据为优先呈现",
            rationale: "安全可控",
            applicableCondition: "人群标签=身体状况不佳时优先",
            orientation: "leverage",
          },
        ],
      },
      {
        id: "dp-dose-titration",
        name: "起始剂量与滴定策略",
        stage: "follow_up",
        qnaCategory: { l1: "策略传递", l2: "沟通策略", l3: "异议处理" },
        status: "approved",
        lastVerifiedAt: "2026-01-20",
        allowMultiTrigger: false,
        alternatives: [
          {
            id: "alt-a",
            content: "标准剂量起始",
            rationale: "常规方案",
            applicableCondition: "默认方向",
            orientation: "defense",
          },
          {
            id: "alt-b",
            content: "减量起始",
            rationale: "降低不良反应风险",
            applicableCondition: "人群标签=身体状况不佳时优先",
            orientation: "defense",
          },
        ],
      },
    ],
  },
];

MOCK_LIBRARIES.push({
  id: "lib-yinglida-rcc",
  product: "英立达",
  diseaseArea: "肾细胞癌",
  populationTags: [
    { id: "pt-metastatic-onset", label: "初诊即转移性/不可手术" },
    { id: "pt-post-surgery-recurrence", label: "手术后复发" },
    { id: "pt-tki-failed", label: "既往TKI单药治疗失败" },
    { id: "pt-ae-heavy", label: "一线不耐受，AE重" },
  ],
  decisionPoints: [
    {
      id: "dp-rcc-progression-path",
      name: "一线进展后的路径选择",
      stage: "treatment_course",
      qnaCategory: { l1: "疾病诊疗知识", l2: "医保政策", l3: "合理用药" },
      status: "approved",
      lastVerifiedAt: "2026-02-20",
      allowMultiTrigger: true,
      alternatives: [
        {
          id: "alt-a",
          content: "转为靶免联合方案",
          rationale: "「二线靶免联合基石」定位，多个病例复用此表述",
          applicableCondition: "人群标签=一线进展-TKI进展时优先",
          orientation: "leverage",
        },
        {
          id: "alt-b",
          content: "评估其他后线选择（如联合方案已用尽）",
          rationale: "需重新评估治疗策略",
          applicableCondition: "人群标签=一线进展-ICI进展，且已用过靶免联合时",
          orientation: "defense",
        },
      ],
    },
    {
      id: "dp-rcc-brand-evidence",
      name: "靶向药物临床获益对比依据",
      stage: "treatment_course",
      qnaCategory: { l1: "产品选择", l2: "竞品分析", l3: "关键证据" },
      status: "approved",
      lastVerifiedAt: "2026-02-20",
      allowMultiTrigger: false,
      alternatives: [
        {
          id: "alt-a",
          content: "强调机制特异性",
          rationale: "高效、高选择性抑制VEGFR-1,2,3",
          applicableCondition: "默认方向",
          orientation: "leverage",
        },
        {
          id: "alt-b",
          content: "强调联合方案疗效数据",
          rationale: "全程管理下单药/联合获益显著",
          applicableCondition: "人群标签=一线进展-TKI进展（考虑靶免联合时）优先",
          orientation: "leverage",
        },
      ],
    },
  ],
});

/** 产品 → 库的查找，疾病领域由库定义1:1带出，不需要单独按疾病领域过滤 */
export function findLibraryByProduct(product: string) {
  return MOCK_LIBRARIES.find((lib) => lib.product === product);
}
