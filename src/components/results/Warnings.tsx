import type { WarningCode } from "@/types";
import { AlertTriangle } from "lucide-react";

const MESSAGES: Record<WarningCode, string> = {
  "ha-overkill-for-bracket-a":
    "HA clustering generally only yields positive ROI at Bracket B+. For small deployments, a single-node topology with robust automated snapshots and backup schemes is recommended.",
  "implausible-load-spread":
    "Your questionnaire results span a wide mathematical variance (e.g., massive population but extremely low application counts). Please review step 2 and 3 inputs to ensure procurement accuracy."
};

export function Warnings({ codes }: { codes: WarningCode[] }) {
  if (codes.length === 0) return null;
  
  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-200 space-y-3 shadow-lg shadow-amber-950/10">
      <div className="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider text-xs font-mono">
        <AlertTriangle className="h-4.5 w-4.5 text-amber-400 animate-pulse-slow" />
        <span>Sizing Diagnostics Alert</span>
      </div>
      <div className="space-y-2 pl-6">
        {codes.map((c) => (
          <p key={c} className="font-light leading-relaxed text-xs">
            {MESSAGES[c]}
          </p>
        ))}
      </div>
    </div>
  );
}
