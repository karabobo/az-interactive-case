import type { ReactNode } from "react";

type Tone = "brand" | "gold" | "teal" | "wine" | "neutral";

const TONE_CLASSES: Record<Tone, string> = {
  brand: "bg-brand-100 text-brand-700",
  gold: "bg-gold-100 text-gold-700",
  teal: "bg-teal-100 text-teal-700",
  wine: "bg-wine-100 text-wine-700",
  neutral: "bg-surface-sunken text-foreground-soft border border-border",
};

export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide ${TONE_CLASSES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
