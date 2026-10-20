import { notFound } from "next/navigation";
import { SharedCasePreview } from "@/components/template/SharedCasePreview";
import { getDb } from "@/lib/server/db";
import type { CaseProjectSnapshot } from "@/lib/types/case";

export const dynamic = "force-dynamic";

export default async function PublicCasePreview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = getDb().prepare("SELECT name, snapshot_json FROM case_projects WHERE id = ?").get(id);
  if (!row) notFound();

  let snapshot: CaseProjectSnapshot;
  try {
    snapshot = JSON.parse(String(row.snapshot_json)) as CaseProjectSnapshot;
  } catch {
    notFound();
  }
  if (!snapshot!.storyActs?.length) notFound();

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-7 sm:px-8">
      <div className="mx-auto mb-4 max-w-[420px] text-center">
        <p className="text-[10px] font-semibold tracking-[0.18em] text-brand-700">AI INTERACTIVE CASE</p>
        <h1 className="mt-1 text-base font-semibold text-slate-800">{String(row.name)}</h1>
      </div>
      <SharedCasePreview snapshot={snapshot!} />
    </main>
  );
}
