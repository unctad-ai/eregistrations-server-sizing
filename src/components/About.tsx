import { Scale, BookOpen, Layers, ShieldAlert, Database, HardDrive, Terminal, Gauge, DatabaseBackup } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function About() {
  return (
    <div className="space-y-10 max-w-4xl mx-auto py-4">
      {/* Header section */}
      <div className="space-y-3.5">
        <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wider text-accent uppercase font-mono">
          <BookOpen className="h-3.5 w-3.5" />
          <span>Technical Reference Documentation</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight leading-none font-heading">
          Sizing Calibration & Methodology
        </h1>
        <p className="text-base text-obsidian-300 font-light leading-relaxed max-w-2xl">
          This system produces server specifications for digital government registries. 
          All calculations are mathematically anchored to actual operational telemetry gathered from existing UNCTAD/eRegistrations country clusters, rather than theoretical synthetic load projections.
        </p>
      </div>

      {/* Grid of Sizing Steps */}
      <div className="space-y-5">
        <h2 className="text-xs font-bold text-white tracking-widest uppercase font-mono">
          How Sizing Calibration Works
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Card 1 */}
          <div className="glass-panel p-5 border-obsidian-850 bg-obsidian-900/40 space-y-3">
            <div className="p-2 h-9 w-9 rounded-lg bg-accent/10 border border-accent/20 text-accent flex items-center justify-center">
              <Scale className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-heading">
              1. Compute Sizing Bracket
            </h3>
            <p className="text-xs text-obsidian-400 font-light leading-relaxed">
              Three critical variables—Population Scale, Service Scope, and Transaction Concurrency—are graded from 1–3 and averaged. The output maps directly to specialized hardware thresholds (Bracket A, B, or C).
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-panel p-5 border-obsidian-850 bg-obsidian-900/40 space-y-3">
            <div className="p-2 h-9 w-9 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <HardDrive className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-heading">
              2. Disk Buffer Projections
            </h3>
            <p className="text-xs text-obsidian-400 font-light leading-relaxed">
              Upload frequencies and planning horizons (1, 3, or 5 years) act as multipliers. NVMe SSD arrays are adjusted upward using a safety margin to avoid file storage depletion.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-panel p-5 border-obsidian-850 bg-obsidian-900/40 space-y-3">
            <div className="p-2 h-9 w-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Layers className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-heading">
              3. Environment Scaling
            </h3>
            <p className="text-xs text-obsidian-400 font-light leading-relaxed">
              Based on the environments requested, additional hosts are calculated. Dev and Test VMs are budgeted at exactly one-third of Production compute thresholds to conserve infrastructure expenditure.
            </p>
          </div>

          {/* Card 4 */}
          <div className="glass-panel p-5 border-obsidian-850 bg-obsidian-900/40 space-y-3">
            <div className="p-2 h-9 w-9 rounded-lg bg-accent/10 border border-accent/20 text-accent flex items-center justify-center">
              <Database className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-heading">
              4. Database Placement
            </h3>
            <p className="text-xs text-obsidian-400 font-light leading-relaxed">
              Every environment is a single VM, matching the architecture of the automated installer. PostgreSQL and MongoDB normally run on that VM; declaring one externally managed subtracts its disk and memory share from the production host.
            </p>
          </div>
        </div>
      </div>

      {/* Platform Requirements */}
      <div className="space-y-5">
        <h2 className="text-xs font-bold text-white tracking-widest uppercase font-mono">
          Platform Requirements
        </h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {/* OS */}
          <div className="glass-panel p-5 border-obsidian-850 bg-obsidian-900/40 space-y-3">
            <div className="p-2 h-9 w-9 rounded-lg bg-accent/10 border border-accent/20 text-accent flex items-center justify-center">
              <Terminal className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-heading">
              Operating System
            </h3>
            <p className="text-xs text-obsidian-400 font-light leading-relaxed">
              Ubuntu 24.04 or 26.04 LTS, hard-enforced by the installer preflight. MongoDB installs directly on the host only on 24.04; on 26.04 the installer runs it containerized.
            </p>
          </div>

          {/* Installer floor */}
          <div className="glass-panel p-5 border-obsidian-850 bg-obsidian-900/40 space-y-3">
            <div className="p-2 h-9 w-9 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Gauge className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-heading">
              Installer Floor
            </h3>
            <p className="text-xs text-obsidian-400 font-light leading-relaxed">
              Hard minimum of 4 vCPU, 8 GB RAM and 100 GB disk. The platform stack occupies ~50 GB and the image pull another ~26 GB; the brackets on this site deliberately size above that floor to leave room for production growth.
            </p>
          </div>

          {/* Backup headroom */}
          <div className="glass-panel p-5 border-obsidian-850 bg-obsidian-900/40 space-y-3">
            <div className="p-2 h-9 w-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <DatabaseBackup className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-heading">
              Backup Headroom
            </h3>
            <p className="text-xs text-obsidian-400 font-light leading-relaxed">
              Nightly dumps run at 00:00, keeping 14 generations plus the newest 3 on the same local volume; a 16 GB swapfile sits on the root volume. Budget disk accordingly.
            </p>
          </div>
        </div>
      </div>

      {/* Procurement Note / Limitations */}
      <div className="rounded-xl border border-obsidian-800 bg-obsidian-950 p-5 space-y-3 shadow-lg relative overflow-hidden">
        <div className="flex items-center gap-2 text-obsidian-300 font-bold uppercase tracking-wider text-xs font-mono">
          <ShieldAlert className="h-4.5 w-4.5 text-blue-400 animate-pulse-slow" />
          <span>Procurement Boundary & Guidelines</span>
        </div>
        <p className="text-xs text-obsidian-400 font-light leading-relaxed pl-7">
          This sizing system is calibrated to serve as a high-fidelity starting reference for architectural planning and cost projections. It does not replace a binding engineering assessment. Procurement proposals should always undergo formal verification with the operational DevOps engineers responsible for maintaining the registry.
        </p>
      </div>

      {/* Back button */}
      <div className="pt-2">
        <Link to="/">
          <Button variant="outline" className="border-obsidian-800 hover:border-obsidian-750 bg-obsidian-900 text-obsidian-200 hover:text-white hover:bg-obsidian-800 px-5 py-2 rounded-lg">
            ← Return to Landing Page
          </Button>
        </Link>
      </div>
    </div>
  );
}
