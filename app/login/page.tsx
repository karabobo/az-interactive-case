"use client";

import { useState } from "react";
import { LogIn, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setLoading(true); setError("");
    const response = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
    const data = await response.json(); setLoading(false);
    if (!response.ok) return setError(data.error ?? "操作失败");
    router.replace("/create/case-input"); router.refresh();
  }

  return <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-background to-violet-50 p-5"><section className="w-full max-w-md rounded-2xl border border-border bg-surface p-7 shadow-xl shadow-brand-900/5">
    <p className="text-xs font-semibold tracking-[0.15em] text-brand-700">AZ COMMERCIAL AI</p>
    <h1 className="mt-2 text-2xl font-semibold text-foreground">AI 内容生成平台</h1>
    <p className="mt-2 text-sm text-foreground-soft">登录后可保存病例项目，并随时继续编辑。</p>
    <div className="mt-6 flex rounded-lg bg-surface-sunken p-1 text-sm"><button type="button" onClick={() => setMode("login")} className={`flex-1 rounded-md py-2 ${mode === "login" ? "bg-surface font-medium text-foreground shadow-sm" : "text-foreground-faint"}`}>登录</button><button type="button" onClick={() => setMode("register")} className={`flex-1 rounded-md py-2 ${mode === "register" ? "bg-surface font-medium text-foreground shadow-sm" : "text-foreground-faint"}`}>注册</button></div>
    <form onSubmit={submit} className="mt-5 flex flex-col gap-4"><label className="text-sm text-foreground-soft">账号<input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-foreground outline-none focus:border-brand-400" /></label><label className="text-sm text-foreground-soft">密码<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-foreground outline-none focus:border-brand-400" /></label>{error && <p className="text-sm text-wine-700">{error}</p>}<Button type="submit" disabled={loading}>{mode === "login" ? <><LogIn size={15} />登录</> : <><UserPlus size={15} />创建账号</>}</Button></form>
    {mode === "login" && <p className="mt-4 text-xs text-foreground-faint">演示管理员账号：admin / admin</p>}
  </section></main>;
}
