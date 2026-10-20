import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { STAGE_LABEL, STAGE_ORDER, type CaseField, type TriggeredDecisionPoint } from "@/lib/types/case";

function line(label: string, value: string | null) {
  return new Paragraph({ children: [new TextRun({ text: `${label}：`, bold: true }), new TextRun(value?.trim() || "待补充")] });
}

/** 在浏览器内生成完整结构化病例 Word，不将病例内容发送给额外的文档服务。 */
export async function downloadStructuredCaseDocx(params: {
  projectName: string;
  fields: CaseField[];
  interactionPoints: TriggeredDecisionPoint[];
}) {
  const children: Paragraph[] = [
    new Paragraph({ text: "互动病例完整结构化病例", heading: HeadingLevel.TITLE }),
    new Paragraph({ text: `病例项目：${params.projectName}` }),
    new Paragraph({ text: "本文件包含基础病例、按时间线拆分的治疗节点及已纳入的互动问题。" }),
  ];

  for (const stage of STAGE_ORDER) {
    const stageFields = params.fields.filter((field) => field.stage === stage);
    if (stageFields.length === 0) continue;
    children.push(new Paragraph({ text: STAGE_LABEL[stage], heading: HeadingLevel.HEADING_1 }));
    stageFields.forEach((field) => children.push(line(field.label, field.value)));
  }

  children.push(new Paragraph({ text: "互动问题", heading: HeadingLevel.HEADING_1 }));
  if (params.interactionPoints.length === 0) {
    children.push(new Paragraph("当前未纳入互动问题。"));
  } else {
    params.interactionPoints.forEach((point, index) => {
      children.push(new Paragraph({ text: `${index + 1}. ${point.decisionPointName}`, heading: HeadingLevel.HEADING_2 }));
      if (point.timelineNodeLabel) children.push(new Paragraph(`插入节点：${point.timelineNodeLabel}`));
      point.alternatives.forEach((alternative, alternativeIndex) => {
        const name = `方向 ${String.fromCharCode(65 + alternativeIndex)}`;
        children.push(line(name, alternative.content));
        children.push(line("支持证据", alternative.rationale));
        children.push(line("适用条件", alternative.applicableCondition));
      });
    });
  }

  const wordDocument = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: { ascii: "Arial", hAnsi: "Arial", eastAsia: "Microsoft YaHei" },
          },
        },
      },
    },
    sections: [{ children }],
  });
  const blob = await Packer.toBlob(wordDocument);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${params.projectName || "完整结构化病例"}.docx`;
  anchor.click();
  URL.revokeObjectURL(url);
}
