import type { EnvironmentCard, ServerSpec, ServerRole } from "@/types";
import { portsForServer, formatPorts } from "@/lib/ports";
import { Cpu, Cloud, Server } from "lucide-react";

const ENV_LABELS: Record<EnvironmentCard["env"], { title: string; style: string; badge: string }> = {
  production: {
    title: "Production",
    style: "border-accent/40 bg-accent/5 shadow-accent/5",
    badge: "bg-accent/10 text-accent border-accent/20"
  },
  dev: {
    title: "Development Host",
    style: "border-blue-500/30 bg-blue-500/5 shadow-blue-500/5",
    badge: "bg-blue-500/10 text-blue-400 border-blue-500/20"
  },
  test: {
    title: "Test / QA",
    style: "border-indigo-500/30 bg-indigo-500/5 shadow-indigo-500/5",
    badge: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
  }
};

const ROLE_LABEL: Record<ServerRole, string> = {
  "all-in-one": "All-in-One Server",
  app: "Application Server"
};

function databasesLine(s: ServerSpec): string {
  const ext = s.externalDatabases ?? [];
  const label = (db: "postgresql" | "mongodb") =>
    `${db === "postgresql" ? "PostgreSQL" : "MongoDB"} ${ext.includes(db) ? "externally managed" : "on this server"}`;
  return `${label("postgresql")} · ${label("mongodb")}`;
}

export function RecommendationCard({ card }: { card: EnvironmentCard }) {
  const envMeta = ENV_LABELS[card.env];

  return (
    <div className={`glass-panel border-obsidian-850 p-6 flex flex-col justify-between break-inside-avoid relative overflow-hidden transition-all duration-300 hover:border-obsidian-750 hover:shadow-black/50 ${envMeta.style}`}>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-obsidian-800/60 mb-5">
          <h3 className="text-base font-bold text-white uppercase tracking-wide font-heading">
            {envMeta.title}
          </h3>
          <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${envMeta.badge}`}>
            {card.env}
          </span>
        </div>

        {/* OS requirement */}
        <div className="text-[10px] text-obsidian-500 font-mono mb-4">
          OS: Ubuntu 24.04 / 26.04 LTS
        </div>

        {/* Server Specs List */}
        <ul className="space-y-4">
          {card.servers.map((s, i) => (
            <li key={i} className="flex gap-4 p-3 bg-obsidian-950/60 rounded-xl border border-obsidian-850/60 hover:border-obsidian-800 transition-colors">
              <div className="p-2 h-9 w-9 rounded-lg bg-obsidian-900 border border-obsidian-800 flex items-center justify-center text-obsidian-400 mt-0.5">
                {s.role === "app" ? <Cpu className="h-4 w-4 text-accent" /> : <Server className="h-4 w-4 text-accent" />}
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold text-obsidian-100 uppercase tracking-wider">{ROLE_LABEL[s.role]}</div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-obsidian-400 font-mono">
                  <span>{s.vcpu} vCPU</span>
                  <span className="text-obsidian-700">•</span>
                  <span>{s.ramGiB} GB RAM</span>
                  <span className="text-obsidian-700">•</span>
                  <span>{s.diskGB} GB NVMe SSD</span>
                  <span className="text-obsidian-700">•</span>
                  <span className="text-accent/80 font-semibold">{s.networkGbps} Gbps network link</span>
                </div>
                <div className="text-[10px] text-obsidian-500 font-mono">
                  Databases: {databasesLine(s)}
                </div>
                <div className="text-[10px] text-obsidian-500 font-mono">
                  Ports: {formatPorts(portsForServer(s))}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Cloud SKU equivalents section */}
      <div className="mt-6 pt-5 border-t border-obsidian-800/60 text-xs">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-obsidian-400 font-mono mb-3">
          <Cloud className="h-3.5 w-3.5 text-accent" />
          <span>Recommended Procurement Equivalents</span>
        </div>
        
        <div className="grid grid-cols-3 gap-2.5">
          {/* AWS SKU */}
          <div className="p-2.5 bg-obsidian-950/70 border border-obsidian-850 hover:border-amber-500/20 rounded-lg text-center transition-colors">
            <span className="text-[9px] uppercase tracking-widest text-amber-500 font-bold block mb-1">AWS</span>
            <span className="font-mono text-obsidian-200 font-semibold break-all text-[10px]">{card.skus.aws}</span>
          </div>

          {/* Hetzner SKU */}
          <div className="p-2.5 bg-obsidian-950/70 border border-obsidian-850 hover:border-red-500/20 rounded-lg text-center transition-colors">
            <span className="text-[9px] uppercase tracking-widest text-red-500 font-bold block mb-1">Hetzner</span>
            <span className="font-mono text-obsidian-200 font-semibold break-all text-[10px]">{card.skus.hetzner}</span>
          </div>

          {/* OVHcloud SKU */}
          <div className="p-2.5 bg-obsidian-950/70 border border-obsidian-850 hover:border-blue-500/20 rounded-lg text-center transition-colors">
            <span className="text-[9px] uppercase tracking-widest text-blue-400 font-bold block mb-1">OVH</span>
            <span className="font-mono text-obsidian-200 font-semibold break-all text-[10px]">{card.skus.ovh}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
