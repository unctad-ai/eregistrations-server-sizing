import { useMemo } from "react";
import type { Answers, ServerRole } from "@/types";
import { pickBracket } from "@/lib/brackets";
import { Cpu, HardDrive, Network, Database, LucideIcon } from "lucide-react";

interface Props {
  answers: Partial<Answers>;
}

const SCORE: Record<string, number> = { small: 1, medium: 2, large: 3 };

const ROLE_ICONS: Record<ServerRole, LucideIcon> = {
  "all-in-one": Cpu,
  app: Cpu,
  db: Database,
  "app-1": Cpu,
  "app-2": Cpu,
  "db-1": Database,
  "db-2": Database
};

const ROLE_LABELS: Record<ServerRole, string> = {
  "all-in-one": "All-in-One Server",
  app: "App Server",
  db: "Database Server",
  "app-1": "App Server 1 (HA)",
  "app-2": "App Server 2 (HA)",
  "db-1": "Database Server 1 (HA)",
  "db-2": "Database Server 2 (HA)"
};

export function ServerRack({ answers }: Props) {
  // Fill missing answers with default values for visualization preview
  const activeAnswers = useMemo((): Answers => {
    return {
      population: answers.population ?? "medium",
      services: answers.services ?? "medium",
      applications: answers.applications ?? "medium",
      attachments: answers.attachments ?? "sometimes",
      horizon: answers.horizon ?? "3y",
      environments: answers.environments ?? ["production"],
      topology: answers.topology ?? "single"
    };
  }, [answers]);

  // Compute Bracket
  const avgLoad = useMemo(() => {
    const pScore = SCORE[activeAnswers.population] ?? 2;
    const sScore = SCORE[activeAnswers.services] ?? 2;
    const aScore = SCORE[activeAnswers.applications] ?? 2;
    return (pScore + sScore + aScore) / 3;
  }, [activeAnswers]);

  const bracket = useMemo(() => pickBracket(avgLoad), [avgLoad]);

  // Calculate adjusted disks and server specs
  const servers = useMemo(() => {
    const topology = activeAnswers.topology;
    const base = bracket;

    // Single server
    if (topology === "single") {
      return [{ role: "all-in-one" as ServerRole, vcpu: base.vcpu, ram: base.ramGiB, disk: base.diskGB }];
    }

    const appDisk = Math.ceil(base.diskGB / 3);
    const dbDisk = Math.ceil((base.diskGB * 2) / 3);
    const dbCpu = Math.ceil(base.vcpu / 2);

    if (topology === "split-db") {
      return [
        { role: "app" as ServerRole, vcpu: base.vcpu, ram: base.ramGiB, disk: appDisk },
        { role: "db" as ServerRole, vcpu: dbCpu, ram: base.ramGiB, disk: dbDisk }
      ];
    }

    // ha
    return [
      { role: "app-1" as ServerRole, vcpu: base.vcpu, ram: base.ramGiB, disk: appDisk },
      { role: "app-2" as ServerRole, vcpu: base.vcpu, ram: base.ramGiB, disk: appDisk },
      { role: "db-1" as ServerRole, vcpu: dbCpu, ram: base.ramGiB, disk: dbDisk },
      { role: "db-2" as ServerRole, vcpu: dbCpu, ram: base.ramGiB, disk: dbDisk }
    ];
  }, [bracket, activeAnswers.topology]);

  return (
    <div className="glass-panel p-5 flex flex-col h-full border-obsidian-800/80 shadow-2xl relative overflow-hidden">
      {/* Absolute background element for high-tech aesthetic */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-accent/5 rounded-full filter blur-3xl -z-10 animate-pulse-slow"></div>

      {/* Title Header */}
      <div className="pb-3 border-b border-obsidian-800/80 flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-white tracking-wide uppercase font-heading">
            Live Server Rack Visualizer
          </h3>
          <p className="text-[10px] text-obsidian-400 font-mono mt-0.5">
            Topology: <span className="text-accent font-semibold">{activeAnswers.topology.toUpperCase()}</span>
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-obsidian-400 font-mono block">Estimated Size</span>
          <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent to-blue-400 uppercase tracking-widest font-heading">
            Bracket {bracket.id}
          </span>
        </div>
      </div>

      {/* The Physical Rack Cabinet */}
      <div className="flex-1 flex flex-col justify-start border-2 border-obsidian-800/80 bg-obsidian-950 p-3 rounded-lg relative overflow-y-auto max-h-[360px] min-h-[300px] shadow-inner">
        {/* Rack rails */}
        <div className="absolute inset-y-0 left-1.5 w-1 bg-obsidian-800/80 rounded" />
        <div className="absolute inset-y-0 right-1.5 w-1 bg-obsidian-800/80 rounded" />

        {/* Server Blades Stack */}
        <div className="space-y-2.5 z-10 py-1">
          {servers.map((s, idx) => {
            const Icon = ROLE_ICONS[s.role] || Cpu;
            return (
              <div
                key={idx}
                className="bg-obsidian-900/90 border border-obsidian-800/80 hover:border-accent/40 hover:bg-obsidian-900 p-3 rounded-md transition-all duration-300 relative group shadow-lg flex flex-col gap-2"
              >
                {/* Active blinking lights */}
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                  </span>
                  <span className="text-[9px] font-mono text-obsidian-500 font-bold uppercase tracking-wider">
                    U{servers.length - idx}
                  </span>
                </div>

                {/* Blade Info */}
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded bg-accent/5 border border-accent/15 text-accent">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h5 className="text-[11px] font-bold text-obsidian-100 uppercase tracking-wider">
                      {ROLE_LABELS[s.role]}
                    </h5>
                    <p className="text-[9px] text-obsidian-400 font-mono mt-0.5">
                      {s.vcpu} vCPU · {s.ram} GB RAM · {s.disk} GB NVMe
                    </p>
                  </div>
                </div>

                {/* Resource bar visualizations */}
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-obsidian-800/30">
                  <div>
                    <div className="flex justify-between text-[8px] font-mono text-obsidian-400 mb-0.5">
                      <span>CPU</span>
                      <span className="text-accent">{Math.round((s.vcpu / 16) * 100)}%</span>
                    </div>
                    <div className="h-1 w-full bg-obsidian-950 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent transition-all duration-500"
                        style={{ width: `${(s.vcpu / 16) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[8px] font-mono text-obsidian-400 mb-0.5">
                      <span>RAM</span>
                      <span className="text-blue-400">{Math.round((s.ram / 128) * 100)}%</span>
                    </div>
                    <div className="h-1 w-full bg-obsidian-950 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${(s.ram / 128) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[8px] font-mono text-obsidian-400 mb-0.5">
                      <span>DISK</span>
                      <span className="text-emerald-400">{Math.round((s.disk / 2000) * 100)}%</span>
                    </div>
                    <div className="h-1 w-full bg-obsidian-950 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${(s.disk / 2000) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Network / Capacity Footnotes */}
      <div className="mt-4 pt-3 border-t border-obsidian-800/80 flex items-center justify-between text-[10px] text-obsidian-400 font-mono">
        <div className="flex items-center gap-1.5">
          <Network className="h-3.5 w-3.5 text-blue-400 animate-pulse-slow" />
          <span>{servers.length * bracket.networkGbps} Gbps Aggregate Port</span>
        </div>
        <div className="flex items-center gap-1.5">
          <HardDrive className="h-3.5 w-3.5 text-accent" />
          <span>NVMe RAID 10 Array</span>
        </div>
      </div>
    </div>
  );
}
