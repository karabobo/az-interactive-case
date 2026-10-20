"use client";

import { Stepper, useCurrentStepIndex } from "@/components/layout/Stepper";

export function CreateStepperBar() {
  const currentIndex = useCurrentStepIndex();
  return <Stepper currentIndex={currentIndex} />;
}
