/**
 * "选择药品名称"的选项目录，按疾病类型分组——与参考站 havas.imatrix.top 一致。
 * 注：这里是场景选择的展示目录，不等同于决策分支点库的 product 字段
 * （decision-library.ts 里的博瑞纳/英立达是ADR示例数据，两者暂未打通——
 * 选择本目录中的药品后，"互动问题生成"若查不到对应库会按ADR-0005降级为静态展示）。
 */
import type { DiseaseType } from "@/lib/types/case";

export const PRODUCT_CATALOG: Record<DiseaseType, string[]> = {
  tumor: ["泰瑞沙", "易瑞沙", "沃瑞沙", "优赫得"],
  rare: ["科赛优", "舒立瑞"],
  chronic: ["安达唐", "安达释", "安立泽", "安利格", "倍他乐克"],
  respiratory_digestive: [
    "倍择瑞®令畅®",
    "信必可®都保®",
    "普米克®令舒®",
    "泛福舒",
    "富露施雾化液",
    "耐信",
  ],
};
