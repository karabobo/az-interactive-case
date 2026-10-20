/**
 * Mock 病例样本——用于demo管线，让AI抽取/检索/生成三步有内容可跑。
 * 构造为博瑞纳（ALK+ NSCLC）库能匹配上的病例，与 decision-library.ts 配套。
 * 标注为虚拟示例病例，非真实患者数据。
 */
import type { CaseField, StoryAct, TriggeredDecisionPoint } from "@/lib/types/case";

export const SAMPLE_RAW_TEXT = `患者，女，54岁。
主诉：咳嗽伴右侧胸痛2月余。
现病史：2月前无明显诱因出现咳嗽，干咳为主，伴右侧胸痛，活动后加重，偶有头痛。当地医院胸部CT提示右肺上叶占位，纵隔淋巴结肿大。
既往史：无特殊。
辅助检查：胸部增强CT示右肺上叶软组织肿块，考虑周围型肺癌；头颅MRI提示右侧顶叶单发转移灶，直径约1.2cm，未经治疗；病理穿刺活检示肺腺癌；基因检测示ALK融合阳性（Ventana IHC）。
初诊诊断：右肺腺癌 cT2aN2M1b IVA期，ALK融合阳性，脑转移（右顶叶，未经治疗）。
治疗方案：予以ALK-TKI靶向治疗。
治疗过程：靶向治疗8个月后复查提示颅内病灶稳定，肺部原发灶缩小；治疗14个月后患者出现头痛加重，复查提示原靶向药疗效下降，耐药基因检测送检中。`;

export const SAMPLE_FIELDS: CaseField[] = [
  { id: "f-visit-1", stage: "visit", label: "性别", value: "女", provenance: "original" },
  { id: "f-visit-2", stage: "visit", label: "年龄", value: "54", provenance: "original" },
  {
    id: "f-visit-3",
    stage: "visit",
    label: "主诉",
    value: "咳嗽伴右侧胸痛2月余",
    provenance: "original",
  },
  {
    id: "f-visit-4",
    stage: "visit",
    label: "现病史",
    value:
      "2月前无明显诱因出现咳嗽，干咳为主，伴右侧胸痛，活动后加重，偶有头痛。当地医院胸部CT提示右肺上叶占位，纵隔淋巴结肿大。",
    provenance: "original",
  },
  {
    id: "f-visit-5",
    stage: "visit",
    label: "既往史",
    value: "无特殊",
    provenance: "original",
  },
  {
    id: "f-visit-6",
    stage: "visit",
    label: "个人史/家族史",
    value: "原文未提及，按同类病例常见情形补全为「无特殊」，供参考核实",
    provenance: "ai_completed",
  },

  {
    id: "f-exam-1",
    stage: "relevant_exams",
    label: "影像学检查",
    value:
      "胸部增强CT：右肺上叶软组织肿块，考虑周围型肺癌；头颅MRI：右侧顶叶单发转移灶，直径约1.2cm，未经治疗",
    provenance: "original",
  },
  {
    id: "f-exam-2",
    stage: "relevant_exams",
    label: "实验室检查",
    value: "病理穿刺活检：肺腺癌；基因检测：ALK融合阳性（Ventana IHC）",
    provenance: "original",
  },
  {
    id: "f-diag-2",
    stage: "diagnosis",
    label: "主要诊断",
    value: "右肺腺癌 cT2aN2M1b IVA期，ALK融合阳性，脑转移（右顶叶，未经治疗）",
    provenance: "original",
  },
  {
    id: "f-diag-3",
    stage: "diagnosis",
    label: "诊断依据",
    value:
      "临床表现：咳嗽、胸痛、头痛；影像：右肺上叶肿块伴纵隔淋巴结肿大、右顶叶单发脑转移灶；病理：肺腺癌；分子分型：ALK融合阳性",
    provenance: "original",
  },

  {
    id: "f-treat-1",
    stage: "treatment_course",
    label: "治疗方案",
    value: "予以ALK-TKI靶向治疗，同时监测颅内病灶变化",
    provenance: "original",
  },
  {
    id: "f-treat-2",
    stage: "treatment_course",
    label: "治疗目标",
    value: "原文未明确表述，按ALK+晚期NSCLC一线治疗常规目标补全为「控制颅内外病灶进展，延长PFS」，供参考核实",
    provenance: "ai_completed",
  },
  {
    id: "f-treat-3",
    stage: "treatment_course",
    label: "用药信息",
    value: "ALK-TKI（具体品牌与剂量原文未详细注明）",
    provenance: "original",
  },

  {
    id: "f-follow-1",
    stage: "follow_up",
    label: "随访内容",
    value:
      "靶向治疗8个月后复查：颅内病灶稳定，肺部原发灶缩小；治疗14个月后：患者头痛加重，复查提示原方案疗效下降，耐药基因检测送检中",
    provenance: "original",
  },
  {
    id: "f-follow-2",
    stage: "follow_up",
    label: "转归",
    value: null,
    provenance: "original",
  },

  {
    id: "f-summary-1",
    stage: "case_summary",
    label: "病例小结",
    value:
      "54岁女性，因咳嗽伴右侧胸痛2月余就诊，胸部CT示右肺上叶肿块，头颅MRI示右顶叶单发转移灶（未经治疗），病理确诊肺腺癌、基因检测ALK融合阳性，诊断右肺腺癌 cT2aN2M1b IVA期伴脑转移。予以ALK-TKI靶向治疗，8个月后复查颅内病灶稳定、肺部原发灶缩小；14个月后出现头痛加重、疗效下降迹象，耐药基因检测送检中，尚无明确转归结论。",
    provenance: "original",
  },
];

export const SAMPLE_COMPLETENESS_NOTES: string[] = [
  "个人史/家族史：原文未提及，已按常见情形合理补全并标记，建议核实",
  "治疗目标：原文未明确表述治疗目标，已按ALK+晚期NSCLC常规目标补全并标记，建议核实",
  "用药信息：具体品牌名称与剂量原文未详细注明，结构化字段暂留概述性描述",
  "转归：原文治疗过程止于「耐药基因检测送检中」，尚无明确转归结论，互动病例可在随访环节留出开放式讨论",
];

export const SAMPLE_TRIGGERED_DECISION_POINTS: TriggeredDecisionPoint[] = [
  {
    id: "trig-1",
    decisionPointId: "dp-brain-met-path",
    decisionPointName: "脑转移状态如何影响治疗路径",
    stage: "treatment_course",
    triggerLabel: null,
    matchedPopulationTagLabels: ["脑转移未经治"],
    recommendedAlternativeId: "alt-b",
    alternatives: [], // 运行时由 mock-pipeline 填充自库定义
    feedbackByAlternative: {
      "alt-a":
        "本例头颅MRI已明确提示右顶叶单发转移灶，直接选择「不额外做颅内干预」的单药方案会遗漏对颅内病灶的针对性评估，与该患者的实际影像所见不符。",
      "alt-b":
        "该患者为脑转移未经治，启动ALK-TKI单药的同时重点评估颅内病灶控制能力，正是原始病例后续「8个月复查颅内病灶稳定」这一结果的合理路径——本品在颅内病灶控制上的数据支持这一选择。",
      "alt-c":
        "本例颅内病灶为初次发现、未经治疗，不存在「既往局部治疗后」的情形，此方向更适用于已接受过颅内放疗等局部干预的病例。",
    },
  },
  {
    id: "trig-2",
    decisionPointId: "dp-relapse-path",
    decisionPointName: "后线耐药进展后的路径选择",
    stage: "treatment_course",
    triggerLabel: "第1次触发：治疗14个月后疗效下降",
    matchedPopulationTagLabels: ["既往靶向治疗后进展（耐药）"],
    recommendedAlternativeId: "alt-a",
    alternatives: [],
    feedbackByAlternative: {
      "alt-a":
        "病例已提示「耐药基因检测送检中」，说明诊疗团队正在按规范路径寻找可序贯的耐药机制依据——待结果明确后，若指向可序贯靶点，继续序贯下一代靶向药是与当前诊疗动作一致的方向。",
      "alt-b":
        "在耐药机制检测结果尚未回报前就转为化疗/免疫治疗，会跳过「先明确耐药机制再决策」这一步，与病例当前「送检中」的实际进程不符。",
    },
  },
  {
    id: "trig-3",
    decisionPointId: "dp-brand-evidence",
    decisionPointName: "靶向药物临床获益对比依据",
    stage: "treatment_course",
    triggerLabel: null,
    matchedPopulationTagLabels: ["脑转移未经治"],
    recommendedAlternativeId: "alt-b",
    alternatives: [],
    feedbackByAlternative: {
      "alt-a":
        "PFS数据是通用的一线证据维度，但本例的核心临床问题是「初治脑转移如何控制」，单纯呈现PFS数据不足以回应这一具体顾虑。",
      "alt-b":
        "本例存在未经治疗的脑转移灶，且后续随访已观察到颅内病灶稳定——优先呈现脑转移控制数据，直接对应这个病例最需要回答的临床问题。",
      "alt-c":
        "本例病历未提示患者体能状态不佳或耐受性问题，安全性数据不是当前最贴近病例情境的呈现重点。",
    },
  },
];

/**
 * 短剧故事线大纲——把「结构化病例输出」+「互动问题生成」的产物改写为场景化叙事。
 * 与SAMPLE_FIELDS / SAMPLE_TRIGGERED_DECISION_POINTS一一对应，非独立生成。
 */
export const SAMPLE_STORY_ACTS: StoryAct[] = [
  {
    id: "act-1",
    order: 0,
    stage: "visit",
    title: "幕1 · 就诊",
    sceneDirection:
      "门诊走廊 · 上午。患者攥着刚拍好的胸部CT报告，脚步在诊室门口顿了一下，深吸一口气才推门进去。",
    dialogue: [
      { speaker: "患者", line: "医生，我这咳嗽两个多月了，一直没好，这几天右边胸口也开始疼。" },
      { speaker: "主治医生", line: "咳嗽是干咳还是有痰？疼痛跟呼吸、活动有没有关系？有没有头痛这些不舒服？" },
      { speaker: "患者", line: "干咳，走快点、活动多了胸口疼得更明显，偶尔也会头痛。" },
    ],
    decisionPointIds: [],
  },
  {
    id: "act-2",
    order: 1,
    stage: "diagnosis",
    title: "幕2 · 诊断",
    sceneDirection:
      "阅片室 · 下午。CT片和MRI片并排挂在灯箱上，医生的笔尖停在右肺上叶那团阴影上，久久没有移开。",
    dialogue: [
      { speaker: "主治医生", line: "胸部CT右肺上叶有个肿块，头颅MRI右顶叶也有一个小转移灶，病理和基因检测都出来了。" },
      { speaker: "患者", line: "（声音有点抖）是……不好的那种吗？" },
      { speaker: "主治医生", line: "病理确诊是肺腺癌，基因检测显示ALK融合阳性——这个分型意味着有明确的靶向治疗方向。" },
    ],
    decisionPointIds: [],
  },
  {
    id: "act-3",
    order: 2,
    stage: "treatment_course",
    title: "幕3 · 治疗经过",
    sceneDirection:
      "示教室 · 傍晚。屏幕上投着这份病例的时间线，从确诊一路画到「治疗14个月后头痛加重」，讲者的激光笔先停在两个关键决策点上，再切换到病例对比图表，圈出「脑转移控制数据」那一栏。",
    dialogue: [
      { speaker: "主治医生", line: "这个病例有两个绕不开的决策点：一是脑转移未经治时怎么定治疗路径，二是14个月后出现疗效下降迹象，下一步怎么走。" },
      { speaker: "主治医生", line: "同样是靶向药物，要用哪组数据说服自己，取决于这个病例最紧迫的临床问题是什么。" },
    ],
    decisionPointIds: ["trig-1", "trig-2", "trig-3"],
  },
  {
    id: "act-4",
    order: 3,
    stage: "follow_up",
    title: "幕4 · 随访",
    sceneDirection: "诊室 · 复查日。患者坐下时比第一次从容了些，手里的报告单也不再攥得发皱。",
    dialogue: [
      { speaker: "患者", line: "这次头又疼了，是不是药不管用了？" },
      { speaker: "主治医生", line: "复查看到疗效有下降迹象，我们已经把耐药基因检测送出去了，等结果回来再定下一步——不是没有办法，是需要先弄清楚问题出在哪。" },
    ],
    decisionPointIds: [],
  },
];
