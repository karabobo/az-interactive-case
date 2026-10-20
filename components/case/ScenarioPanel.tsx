"use client";

import { useCaseStore } from "@/lib/store/case-store";
import {
  DISEASE_TYPE_LABEL,
  SCENARIO_LABEL,
  type AudienceType,
  type DiseaseType,
  type UseCaseScenario,
} from "@/lib/types/case";
import { PRODUCT_CATALOG } from "@/lib/mock/product-catalog";

const SCENARIOS = Object.entries(SCENARIO_LABEL) as [UseCaseScenario, string][];
const AUDIENCES: AudienceType[] = ["HCP", "医药代表", "患者/家属"];
const DISEASE_TYPES = Object.entries(DISEASE_TYPE_LABEL) as [DiseaseType, string][];

/** 场景选择——文案/选项与参考站 havas.imatrix.top 完全一致 */
export function ScenarioPanel() {
  const { input, setScenario, setAudience, setDiseaseType, setProduct } =
    useCaseStore();

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-foreground-soft">
        开始前，请先选择您的需求场景
      </p>

      <div>
        <p className="text-sm font-medium text-foreground">1. 选择应用场景</p>
        <p className="mb-2 text-[12px] text-foreground-faint">
          生成的互动病例用在什么场景下使用
        </p>
        <div className="flex flex-wrap gap-2">
          {SCENARIOS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setScenario(key)}
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                input.scenario === key
                  ? "border-transparent bg-brand-700 text-white"
                  : "border-border bg-surface text-foreground-soft hover:bg-surface-sunken"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-foreground">2. 选择目标受众</p>
        <p className="mb-2 text-[12px] text-foreground-faint">
          生成的互动病例是给谁看给谁使用的
        </p>
        <div className="flex flex-wrap gap-2">
          {AUDIENCES.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAudience(a)}
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                input.audience === a
                  ? "border-transparent bg-brand-700 text-white"
                  : "border-border bg-surface text-foreground-soft hover:bg-surface-sunken"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-foreground">3. 选择疾病类型</p>
        <p className="mb-2 text-[12px] text-foreground-faint">
          生成的互动病例涉及到什么疾病领域
        </p>
        <div className="flex flex-wrap gap-2">
          {DISEASE_TYPES.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setDiseaseType(key)}
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                input.diseaseType === key
                  ? "border-transparent bg-brand-700 text-white"
                  : "border-border bg-surface text-foreground-soft hover:bg-surface-sunken"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {input.diseaseType && (
        <div>
          <p className="text-sm font-medium text-foreground">
            4. 选择药品名称
            <span className="ml-1 font-normal text-foreground-faint">
              （可选）
            </span>
          </p>
          <p className="mb-2 text-[12px] text-foreground-faint">
            生成的互动病例治疗过程中使用了什么药品
          </p>
          <div className="flex flex-wrap gap-2">
            {PRODUCT_CATALOG[input.diseaseType].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setProduct(p)}
                className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                  input.product === p
                    ? "border-transparent bg-brand-700 text-white"
                    : "border-border bg-surface text-foreground-soft hover:bg-surface-sunken"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
