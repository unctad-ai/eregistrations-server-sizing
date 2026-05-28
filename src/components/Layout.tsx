import { Outlet, Link, useLocation } from "react-router-dom";
import { Cpu, HelpCircle } from "lucide-react";

export function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-obsidian-950 text-obsidian-100">
      <header className="sticky top-0 z-50 border-b border-obsidian-800/80 bg-obsidian-900/75 backdrop-blur-md transition-all">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-heading text-lg font-bold text-obsidian-50 hover:text-white transition-colors flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-accent/10 border border-accent/20 text-accent">
              <Cpu className="h-5 w-5 animate-pulse-slow" />
            </div>
            <span className="tracking-tight bg-clip-text bg-gradient-to-r from-white to-obsidian-200">
              eRegistrations <span className="text-accent font-semibold">Sizing</span>
            </span>
          </Link>
          <nav className="text-sm font-medium flex items-center gap-6">
            <Link
              to="/about"
              className={`flex items-center gap-1.5 transition-colors ${
                location.pathname === "/about"
                  ? "text-accent"
                  : "text-obsidian-300 hover:text-obsidian-100"
              }`}
            >
              <HelpCircle className="h-4 w-4" />
              <span>Methodology</span>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-10 flex flex-col justify-center">
        <Outlet />
      </main>

      <footer className="border-t border-obsidian-900 bg-obsidian-950/60 text-center text-xs text-obsidian-400 py-6 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="tracking-wide">
            Digital Government Sizing Engine · Anchored to real operational deployments.
          </p>
          <div className="flex items-center gap-2 text-obsidian-500 font-medium bg-obsidian-900/40 px-3 py-1.5 rounded-full border border-obsidian-800/50">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            <span className="text-[10px] uppercase tracking-wider text-obsidian-300">Live Calibration System</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
