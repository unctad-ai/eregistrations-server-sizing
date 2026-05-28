import { Collapsible } from "@/components/ui/collapsible";

export function RationaleBlock({ rationale }: { rationale: string }) {
  return (
    <div className="border-t border-slate-200 pt-6">
      <Collapsible trigger="Why this size?">
        <p>{rationale}</p>
        <p className="mt-3 text-xs text-slate-500">
          Reference deployments used to anchor these brackets: a small-country reference
          (load ~5%, 78% memory, 10 GiB swap in use) and a large-country reference
          (Postgres 123 GB, 781 GB on disk after operational use).
        </p>
      </Collapsible>
    </div>
  );
}
