"use client";

import { useEffect, useState } from "react";
import { FolderOpen, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCaseStore } from "@/lib/store/case-store";

type Project = { id: string; name: string; createdAt: string; updatedAt: string };

export function ProjectList() {
  const router = useRouter();
  const loadProject = useCaseStore((state) => state.loadProject);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/cases").then((response) => response.json()).then((data) => setProjects(data.projects ?? [])).finally(() => setLoading(false));
  }, []);

  async function openProject(id: string) {
    setOpening(id);
    const response = await fetch(`/api/cases/${id}`);
    const data = await response.json();
    if (response.ok) {
      loadProject(data.project);
      router.push("/create/case-input");
    }
    setOpening(null);
  }

  if (loading) return <div className="flex items-center gap-2 text-sm text-foreground-soft"><Loader2 size={16} className="animate-spin" />正在读取病例项目…</div>;
  if (projects.length === 0) return <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center text-sm text-foreground-faint">还没有保存的病例项目。完成录入后点击“保存病例”即可在这里继续编辑。</div>;

  return <div className="grid gap-3 sm:grid-cols-2">{projects.map((project) => <button key={project.id} type="button" onClick={() => openProject(project.id)} className="rounded-xl border border-border bg-surface p-4 text-left hover:border-brand-300 hover:shadow-sm">
    <div className="flex items-start justify-between gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><FolderOpen size={17} /></span>{opening === project.id && <Loader2 size={16} className="animate-spin text-brand-600" />}</div>
    <p className="mt-4 text-sm font-semibold text-foreground">{project.name}</p>
    <p className="mt-1 text-xs text-foreground-faint">最近保存：{new Date(project.updatedAt).toLocaleString("zh-CN")}</p>
  </button>)}</div>;
}
