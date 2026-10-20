"use client";

import { useCaseStore } from "@/lib/store/case-store";
import type { DoctorAvatar, PatientAvatar } from "@/lib/types/case";

const ASSET_ROOT = "/assets/interactive-case";
const DOCTOR_OPTIONS: { id: DoctorAvatar; label: string; src: string }[] = [
  { id: "doctor_male", label: "医生 · 男", src: `${ASSET_ROOT}/doctor-male-v2.png` },
  { id: "doctor_female", label: "医生 · 女", src: `${ASSET_ROOT}/doctor-female-v2.png` },
];
const PATIENT_OPTIONS: { id: PatientAvatar; label: string; src: string }[] = [
  { id: "patient_male", label: "患者 · 男", src: `${ASSET_ROOT}/patient-male-v2.png` },
  { id: "patient_female", label: "患者 · 女", src: `${ASSET_ROOT}/patient-female-v2.png` },
];

function AvatarOption({ label, src, active, onClick }: { label: string; src: string; active: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`group w-28 overflow-hidden rounded-xl border bg-surface text-left transition-all hover:-translate-y-0.5 hover:border-brand-300 ${active ? "border-brand-500 ring-2 ring-brand-200" : "border-border"}`}>
    <span className="flex h-24 items-end justify-center overflow-hidden bg-gradient-to-br from-brand-50 to-teal-50"><img src={src} alt={label} className="h-full max-w-full object-contain object-bottom transition-transform group-hover:scale-105" /></span>
    <span className="block border-t border-border-soft px-2 py-2 text-center text-xs text-foreground-soft">{label}</span>
  </button>;
}

export function AvatarPicker() {
  const { doctorAvatar, patientAvatar, setDoctorAvatar, setPatientAvatar } = useCaseStore();
  return <div className="flex flex-col gap-6"><div><p className="mb-2 text-sm font-medium text-foreground">医生形象 <span className="ml-1.5 font-normal text-foreground-faint">（固定素材，2套可选）</span></p><div className="flex gap-3">{DOCTOR_OPTIONS.map((opt) => <AvatarOption key={opt.id} {...opt} active={doctorAvatar === opt.id} onClick={() => setDoctorAvatar(opt.id)} />)}</div></div><div><p className="mb-2 text-sm font-medium text-foreground">患者形象 <span className="ml-1.5 font-normal text-foreground-faint">（固定素材，2套可选）</span></p><div className="flex gap-3">{PATIENT_OPTIONS.map((opt) => <AvatarOption key={opt.id} {...opt} active={patientAvatar === opt.id} onClick={() => setPatientAvatar(opt.id)} />)}</div></div></div>;
}
