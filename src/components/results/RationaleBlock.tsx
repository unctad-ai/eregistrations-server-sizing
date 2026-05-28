import { HelpCircle, Activity } from "lucide-react";

export function RationaleBlock({ rationale }: { rationale: string }) {
  return (
    <div className="border-t border-obsidian-900 pt-6">
      <div className="glass-panel p-5 border-obsidian-850 bg-obsidian-900/30">
        <div className="flex items-center gap-2 mb-3 text-obsidian-300 font-mono text-xs uppercase tracking-wider">
          <HelpCircle className="h-4.5 w-4.5 text-accent" />
          <span>Sizing Calibration Rationale</span>
        </div>
        
        <div className="text-sm text-obsidian-200 leading-relaxed font-light space-y-3">
          <p>{rationale}</p>
          <div className="mt-4 pt-3 border-t border-obsidian-850/60 flex items-start gap-2.5 text-[11px] text-obsidian-400 font-mono">
            <Activity className="h-4 w-4 text-accent/80 mt-0.5" />
            <div>
              <span className="font-semibold text-obsidian-300">Empirical Calibration Reference Points:</span>
              <ul className="list-disc list-inside mt-1 space-y-0.5 pl-1">
                <li>Small-country anchor: ~5% peak CPU load, 78% RAM utilization, 10 GiB swap storage metrics.</li>
                <li>Large-country anchor: Postgres index volume 123 GB, 781 GB raw disk capacity after operational years.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
