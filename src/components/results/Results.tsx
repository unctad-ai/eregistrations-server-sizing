import { useMemo, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { decodeAnswers } from "@/lib/state";
import { recommend } from "@/lib/recommend";
import { RecommendationCard } from "@/components/results/RecommendationCard";
import { RationaleBlock } from "@/components/results/RationaleBlock";
import { Warnings } from "@/components/results/Warnings";
import { Button } from "@/components/ui/button";
import { 
  Printer, Link2, Edit3, 
  Check, FileSpreadsheet, ShieldCheck 
} from "lucide-react";

const BRACKET_NAMES: Record<string, string> = {
  A: "Core Regional Infrastructure",
  B: "National Scaled Platform",
  C: "High-Concurrency Federal Gateway"
};

export function Results() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const encoded = params.get("state");
  const answers = useMemo(() => (encoded ? decodeAnswers(encoded) : null), [encoded]);

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSpec, setCopiedSpec] = useState(false);

  const r = useMemo(() => (answers ? recommend(answers) : null), [answers]);

  // Compute Total Aggregate Hardware Metrics across all cards
  const aggregateMetrics = useMemo(() => {
    let totalCpu = 0;
    let totalRam = 0;
    let totalDisk = 0;
    let totalServers = 0;

    if (!r) {
      return { cpu: 0, ram: 0, disk: 0, servers: 0 };
    }

    r.cards.forEach((card) => {
      card.servers.forEach((server) => {
        totalCpu += server.vcpu;
        totalRam += server.ramGiB;
        totalDisk += server.diskGB;
        totalServers += 1;
      });
    });

    return {
      cpu: totalCpu,
      ram: totalRam,
      disk: totalDisk,
      servers: totalServers
    };
  }, [r]);

  if (!answers || !r) {
    return (
      <div className="space-y-6 text-center py-12 glass-panel max-w-xl mx-auto border-obsidian-850">
        <p className="text-obsidian-300">No sizing session details detected in parameters.</p>
        <Button onClick={() => navigate("/wizard")} className="bg-accent text-obsidian-950 hover:bg-accent/90 border-none font-semibold">
          Initialize Sizing Assistant
        </Button>
      </div>
    );
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopySpec = () => {
    // Generate a beautiful, clean Markdown spec table for the user to copy!
    let md = `### eRegistrations Server Sizing Procurement Spec\n`;
    md += `*Calibrated Sizing: Bracket ${r.bracket} - ${BRACKET_NAMES[r.bracket]}*\n\n`;
    r.cards.forEach((c) => {
      md += `#### ${c.env.toUpperCase()} Environment\n`;
      c.servers.forEach((s) => {
        md += `- Role: ${s.role.toUpperCase()} | Specs: ${s.vcpu} vCPU, ${s.ramGiB} GB RAM, ${s.diskGB} GB SSD, ${s.networkGbps} Gbps Port\n`;
      });
      md += `- Equivalent Cloud SKUs: AWS (${c.skus.aws}) | Hetzner (${c.skus.hetzner}) | OVH (${c.skus.ovh})\n\n`;
    });
    md += `*Anchored to real operational eRegistrations deployments.*`;

    navigator.clipboard.writeText(md);
    setCopiedSpec(true);
    setTimeout(() => setCopiedSpec(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Dynamic Sizing Hero Banner */}
      <div className="glass-panel p-6 sm:p-8 border-obsidian-800/80 shadow-2xl relative overflow-hidden sweep-effect">
        <div className="absolute top-0 right-0 w-48 h-48 bg-accent/5 rounded-full filter blur-3xl -z-10 animate-pulse-slow"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wider text-accent uppercase font-mono">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Sizing Completed</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight leading-none font-heading">
              Sizing Bracket: <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-blue-400">Bracket {r.bracket}</span>
            </h1>
            <p className="text-sm text-obsidian-300 font-light leading-relaxed">
              Recommended architecture configuration: <strong className="text-white font-medium">{BRACKET_NAMES[r.bracket]}</strong>.
            </p>
          </div>
          
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4 bg-obsidian-950/70 border border-obsidian-850 p-4 rounded-xl font-mono text-center sm:min-w-[280px]">
            <div>
              <span className="text-[10px] text-obsidian-400 uppercase tracking-widest block">Total Cores</span>
              <span className="text-lg font-bold text-accent">{aggregateMetrics.cpu} Cores</span>
            </div>
            <div>
              <span className="text-[10px] text-obsidian-400 uppercase tracking-widest block">Total RAM</span>
              <span className="text-lg font-bold text-blue-400">{aggregateMetrics.ram} GB</span>
            </div>
            <div className="border-t border-obsidian-900 pt-2 col-span-2 flex justify-between px-2 text-[10px] text-obsidian-300">
              <span>{aggregateMetrics.servers} Active Blades</span>
              <span>{(aggregateMetrics.disk / 1000).toFixed(2)} TB Total SSD</span>
            </div>
          </div>
        </div>
      </div>

      {/* Warnings Block */}
      <Warnings codes={r.warnings} />

      {/* Environment Specification Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white tracking-wider uppercase font-mono">
          Environment Specific Specifications
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {r.cards.map((c) => (
            <RecommendationCard key={c.env} card={c} />
          ))}
        </div>
      </div>

      {/* Action panel */}
      <div className="flex flex-wrap gap-4 pt-4 border-t border-obsidian-900 print:hidden items-center justify-between">
        <div className="flex flex-wrap gap-3">
          <Button 
            onClick={() => window.print()}
            className="h-10 px-4 rounded-lg bg-accent text-obsidian-950 hover:bg-accent/90 border-none font-semibold flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Print Sizing Spec PDF
          </Button>
          
          <Button
            variant="outline"
            onClick={handleCopySpec}
            className="h-10 px-4 rounded-lg border-obsidian-800 bg-obsidian-900 text-obsidian-200 hover:text-white hover:bg-obsidian-800 flex items-center gap-2 transition-all"
          >
            {copiedSpec ? <Check className="h-4 w-4 text-accent" /> : <FileSpreadsheet className="h-4 w-4" />}
            {copiedSpec ? "Copied Spec!" : "Copy Spec Markdown"}
          </Button>

          <Button
            variant="outline"
            onClick={handleCopyLink}
            className="h-10 px-4 rounded-lg border-obsidian-800 bg-obsidian-900 text-obsidian-200 hover:text-white hover:bg-obsidian-800 flex items-center gap-2 transition-all"
          >
            {copiedLink ? <Check className="h-4 w-4 text-accent" /> : <Link2 className="h-4 w-4" />}
            {copiedLink ? "Copied Link!" : "Copy Share Link"}
          </Button>
        </div>

        <Link to="/wizard">
          <Button 
            variant="ghost"
            className="h-10 px-4 text-obsidian-400 hover:text-white hover:bg-obsidian-900 flex items-center gap-2"
          >
            <Edit3 className="h-4 w-4" />
            Adjust Sizing Form
          </Button>
        </Link>
      </div>

      {/* Sizing Analysis & Reference anchors */}
      <RationaleBlock rationale={r.rationale} />
    </div>
  );
}
