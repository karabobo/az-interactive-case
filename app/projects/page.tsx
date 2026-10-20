import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { ProjectList } from "@/components/projects/ProjectList";
import { getCurrentUser } from "@/lib/server/auth";

export default async function ProjectsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <div className="flex h-screen bg-background"><Sidebar user={user} /><main className="flex-1 overflow-y-auto px-8 py-6"><div className="mx-auto max-w-4xl"><h1 className="text-xl font-semibold text-foreground">我的病例项目</h1><p className="mt-1 mb-6 text-sm text-foreground-soft">仅显示当前账号保存的病例。打开后可继续编辑并再次保存。</p><ProjectList /></div></main></div>;
}
