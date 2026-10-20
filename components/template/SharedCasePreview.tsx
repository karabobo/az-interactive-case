"use client";

import { useState } from "react";
import { InteractiveH5Preview } from "@/components/template/InteractiveH5Preview";
import type { CaseProjectSnapshot, TriggeredDecisionPoint } from "@/lib/types/case";

/** 供二维码访问的只读互动预览；选择只保留在当前浏览器，不回写病例项目。 */
export function SharedCasePreview({ snapshot }: { snapshot: CaseProjectSnapshot }) {
  const [points, setPoints] = useState<TriggeredDecisionPoint[]>(snapshot.triggeredDecisionPoints);
  const doctorAvatar = snapshot.doctorAvatar ?? "doctor_male";
  const patientAvatar = snapshot.patientAvatar ?? "patient_female";

  return (
    <InteractiveH5Preview
      acts={snapshot.storyActs}
      points={points.filter((point) => point.included !== false)}
      doctorAvatar={doctorAvatar}
      patientAvatar={patientAvatar}
      viewMode="mobile"
      onAlternativeSelect={(pointId, alternativeId) => {
        setPoints((current) => current.map((point) => point.id === pointId
          ? { ...point, selectedAlternativeId: alternativeId }
          : point));
      }}
    />
  );
}
