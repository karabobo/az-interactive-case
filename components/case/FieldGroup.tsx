import { STAGE_LABEL, STAGE_ORDER, type CaseField } from "@/lib/types/case";
import { FieldCard } from "@/components/case/FieldCard";

export function FieldGroup({ fields }: { fields: CaseField[] }) {
  const byStage = STAGE_ORDER.map((stage) => ({
    stage,
    items: fields.filter((f) => f.stage === stage),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="flex flex-col gap-6">
      {byStage.map((group) => (
        <div key={group.stage}>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-600" />
            <h3 className="text-sm font-semibold text-foreground">
              {STAGE_LABEL[group.stage]}
            </h3>
            <span className="text-[11px] text-foreground-faint">
              {group.items.length} 项
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {group.items.map((f) => (
              <FieldCard key={f.id} field={f} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
