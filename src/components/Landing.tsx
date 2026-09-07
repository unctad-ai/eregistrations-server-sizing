import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Zap, HardDrive, ArrowRight, Layers } from "lucide-react";

export function Landing() {
  return (
    <div className="grid gap-12 lg:grid-cols-12 items-center py-6 sm:py-12">
      {/* Left Column - Headline & Pitch */}
      <div className="lg:col-span-7 space-y-8">
        <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wider text-accent uppercase animate-pulse-slow">
          <Layers className="h-3.5 w-3.5" />
          <span>Procurement-Ready Sizing</span>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight font-heading">
            Size your eRegistrations server in <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-emerald-400 to-blue-400">two minutes.</span>
          </h1>
          <p className="text-base sm:text-lg text-obsidian-300 leading-relaxed font-light">
            Answer eight straight-forward questions about your scope, population, and growth plans. 
            We map your answers to three configuration brackets anchored to real operational eRegistrations deployments, producing ready-to-procure specs and cloud SKUs.
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <Link to="/wizard">
            <Button className="h-12 px-6 rounded-lg text-base font-semibold bg-accent text-obsidian-950 hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/20 transition-all flex items-center gap-2 group border-none">
              Start Sizing Assistant
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        {/* Value Prop Badges */}
        <div className="grid sm:grid-cols-2 gap-4 pt-6 border-t border-obsidian-900">
          <div className="flex gap-3">
            <div className="p-2 h-10 w-10 rounded-lg bg-obsidian-900 border border-obsidian-800 flex items-center justify-center text-accent">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-obsidian-100">Zero Spec Guesswork</h4>
              <p className="text-xs text-obsidian-400 mt-0.5">Anchored directly to live operational measurements.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="p-2 h-10 w-10 rounded-lg bg-obsidian-900 border border-obsidian-800 flex items-center justify-center text-blue-400">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-obsidian-100">Procurement-Ready</h4>
              <p className="text-xs text-obsidian-400 mt-0.5">Exports instant hardware checklists and equivalent cloud SKUs.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Beautiful Visual Mockup */}
      <div className="lg:col-span-5 relative">
        <div className="absolute inset-0 bg-gradient-to-tr from-accent/10 to-blue-500/10 rounded-2xl filter blur-2xl -z-10 animate-pulse-slow"></div>
        <div className="glass-panel p-6 border-obsidian-800/80 shadow-2xl relative overflow-hidden sweep-effect">
          <div className="flex items-center justify-between pb-4 border-b border-obsidian-800/50 mb-6">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500/70" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
              <div className="h-3 w-3 rounded-full bg-accent/70" />
            </div>
            <span className="text-[10px] font-mono text-obsidian-400 uppercase tracking-widest">Active Rack Preview</span>
          </div>

          <div className="space-y-4">
            {/* Visual Server 1 */}
            <div className="bg-obsidian-950/70 border border-obsidian-800/60 p-4 rounded-lg flex items-center justify-between hover:border-accent/40 transition-colors">
              <div className="flex items-center gap-3">
                <HardDrive className="h-8 w-8 text-accent animate-pulse-slow" />
                <div>
                  <div className="text-xs font-semibold text-obsidian-200 uppercase tracking-wider">Production Server</div>
                  <div className="text-xs text-obsidian-400 font-mono mt-0.5">1x VM · PostgreSQL &amp; MongoDB On-Server</div>
                </div>
              </div>
              <span className="text-[10px] bg-accent/10 text-accent font-semibold px-2 py-0.5 rounded-full border border-accent/20">Active</span>
            </div>

            {/* Visual Server 2 */}
            <div className="bg-obsidian-950/40 border border-obsidian-900/60 p-4 rounded-lg flex items-center justify-between opacity-70">
              <div className="flex items-center gap-3">
                <HardDrive className="h-8 w-8 text-blue-400" />
                <div>
                  <div className="text-xs font-semibold text-obsidian-300 uppercase tracking-wider">Staging &amp; Testing</div>
                  <div className="text-xs text-obsidian-400 font-mono mt-0.5">1x VM · All-in-One</div>
                </div>
              </div>
              <span className="text-[10px] bg-blue-500/10 text-blue-400 font-semibold px-2 py-0.5 rounded-full border border-blue-500/20">Standby</span>
            </div>

            {/* Visual Server 3 */}
            <div className="bg-obsidian-950/40 border border-obsidian-900/60 p-4 rounded-lg flex items-center justify-between opacity-50">
              <div className="flex items-center gap-3">
                <HardDrive className="h-8 w-8 text-obsidian-400" />
                <div>
                  <div className="text-xs font-semibold text-obsidian-400 uppercase tracking-wider">Development Environment</div>
                  <div className="text-xs text-obsidian-500 font-mono mt-0.5">1x VM · All-in-One</div>
                </div>
              </div>
              <span className="text-[10px] bg-obsidian-800 text-obsidian-400 font-semibold px-2 py-0.5 rounded-full">Inactive</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-obsidian-800/40 flex items-center justify-between text-[11px] text-obsidian-400">
            <span className="font-mono">BRACKET PRESET ENGINE: CALIBRATED</span>
            <span className="text-accent glow-text-emerald font-semibold uppercase tracking-wider">Online</span>
          </div>
        </div>
      </div>
    </div>
  );
}
