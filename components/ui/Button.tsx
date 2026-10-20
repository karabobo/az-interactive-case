import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-violet-500 to-brand-600 text-white shadow-sm hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed",
  secondary:
    "bg-surface text-foreground border border-border hover:bg-surface-sunken disabled:opacity-50 disabled:cursor-not-allowed",
  ghost:
    "bg-transparent text-foreground-soft hover:text-foreground hover:bg-surface-sunken disabled:opacity-50 disabled:cursor-not-allowed",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${VARIANT_CLASSES[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
