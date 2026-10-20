"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export function AccountMenu({ username, role }: { username: string; role: "user" | "admin" }) {
  const router = useRouter();
  return (
    <div className="flex shrink-0 items-center gap-2 rounded-lg border border-border-soft px-2.5 py-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">{username.slice(0, 1).toUpperCase()}</span>
      <span className="min-w-0 flex-1 truncate text-xs text-foreground-soft">{role === "admin" ? "管理员" : username}</span>
      <button
        type="button"
        title="退出登录"
        onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); router.replace("/login"); router.refresh(); }}
        className="rounded p-1 text-foreground-faint hover:bg-surface-sunken hover:text-foreground"
      >
        <LogOut size={14} />
      </button>
    </div>
  );
}
