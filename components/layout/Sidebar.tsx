import Link from "next/link";
import {
  Sparkles,
  FileText,
  Layers,
  Wand2,
  Clapperboard,
  Film,
  Folder,
} from "lucide-react";
import { AccountMenu } from "@/components/layout/AccountMenu";
import type { SessionUser } from "@/lib/server/auth";

// 与 havas.imatrix.top 参考站的侧栏结构保持一致
const AI_CONTENT_ITEMS = [
  { label: "病例幻灯制作", href: "#", icon: FileText, active: false },
  { label: "交互病例制作", href: "/create/case-input", icon: Layers, active: true },
  { label: "海报制作", href: "#", icon: Wand2, active: false },
  { label: "短剧脚本", href: "#", icon: Clapperboard, active: false },
  { label: "互动分镜", href: "#", icon: Film, active: false },
];

const MY_PROJECTS = [{ label: "我的病例项目", href: "/projects" }];

export function Sidebar({ user }: { user: SessionUser }) {
  return (
    <aside className="flex h-full w-56 shrink-0 flex-col justify-between border-r border-border bg-surface px-4 py-5">
      <div className="min-h-0 overflow-y-auto">
        <Link href="/" className="flex items-center gap-2.5 px-1 pb-6">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-brand-500 text-white">
            <Sparkles size={16} />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold text-foreground">
              AI内容生成平台
            </span>
            <span className="block text-[11px] text-foreground-faint">
              AZ Commercial AI
            </span>
          </span>
        </Link>

        <p className="px-1 pb-2 text-[11px] font-medium uppercase tracking-wide text-foreground-faint">
          AI内容生成
        </p>
        <nav className="mb-5 flex flex-col gap-0.5">
          {AI_CONTENT_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                  item.active
                    ? "bg-brand-700 text-white font-medium"
                    : "text-foreground-soft hover:bg-surface-sunken"
                }`}
              >
                <Icon size={15} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <p className="px-1 pb-2 text-[11px] font-medium uppercase tracking-wide text-foreground-faint">
          我的项目
        </p>
        <nav className="flex flex-col gap-0.5">
          {MY_PROJECTS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground-soft transition-colors hover:bg-surface-sunken"
            >
              <Folder size={15} />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <AccountMenu username={user.username} role={user.role} />
    </aside>
  );
}
