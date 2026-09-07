import type { Question } from "@/types";
import { 
  LucideIcon,
  Users, Building2, Globe, 
  FileText, FolderOpen, Layers, 
  Activity, Server, Zap,
  FileX, Paperclip, HardDrive,
  Clock, TrendingUp, Award,
  ShieldCheck, Code2, CheckSquare,
  Database, Cloud, Container
} from "lucide-react";

interface Props {
  question: Question;
  value: string | string[] | undefined;
  onChange: (v: string | string[]) => void;
}

// Icon Mapping Registry
const OPTION_ICONS: Record<string, Record<string, LucideIcon>> = {
  population: {
    small: Users,
    medium: Building2,
    large: Globe
  },
  services: {
    small: FileText,
    medium: FolderOpen,
    large: Layers
  },
  applications: {
    small: Activity,
    medium: Server,
    large: Zap
  },
  attachments: {
    rarely: FileX,
    sometimes: Paperclip,
    most: HardDrive
  },
  horizon: {
    "1y": Clock,
    "3y": TrendingUp,
    "5y": Award
  },
  environments: {
    production: ShieldCheck,
    dev: Code2,
    test: CheckSquare
  },
  postgresql: {
    local: Database,
    external: Cloud
  },
  mongodb: {
    local: Container,
    external: Cloud
  }
};

// Polished Sublabel Context Mapping
const OPTION_SUBLABELS: Record<string, Record<string, string>> = {
  population: {
    small: "Suited for small island nations or municipal systems.",
    medium: "Standard size for mid-sized country registries.",
    large: "Configured for large-scale national federal registries."
  },
  services: {
    small: "Ideal for pilot phases or narrow registry scopes.",
    medium: "Covers full standard corporate registry procedures.",
    large: "Sized for national digital government hub infrastructures."
  },
  applications: {
    small: "Steady operational pace with low concurrency demands.",
    medium: "Standard load profile for active administrative entities.",
    large: "Heavy continuous transaction traffic with high peak volumes."
  },
  attachments: {
    rarely: "Form data-heavy with minimal scanned document uploads.",
    sometimes: "Standard scanned IDs, applications, and corporate articles.",
    most: "Continuous uploading of multi-page scanned PDF portfolios."
  },
  horizon: {
    "1y": "Short-term pilot cycles, requiring fast upgrades.",
    "3y": "Standard government technology procurement lifecycle.",
    "5y": "Maximum stability with 200% growth absorbency buffers."
  },
  environments: {
    production: "Live environment. Anchored with highest security and scaling specs.",
    dev: "Sandboxed playground for engineers to test new releases safely.",
    test: "Mirror of production for quality verification and staging."
  },
  postgresql: {
    local: "PostgreSQL 18 installed on the same server. The installer standard.",
    external: "Managed database service operated by your ministry or provider."
  },
  mongodb: {
    local: "MongoDB on the same server — host install or container, by OS.",
    external: "Hosted MongoDB service (e.g. Atlas) managed outside this server."
  }
};

export function QuestionStep({ question, value, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-tight">
          {question.label}
        </h2>
        <p className="text-sm text-obsidian-300 font-light mt-1.5 leading-relaxed max-w-xl">
          {question.help}
        </p>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-1">
        {question.options.map((o) => {
          // Dynamic Icon Retrieval
          const Icon = OPTION_ICONS[question.id]?.[o.value] || Server;
          const sublabel = OPTION_SUBLABELS[question.id]?.[o.value] || "";

          // Determine Selection state
          let active = false;
          let isForced = false;

          if (question.type === "single") {
            active = value === o.value;
          } else {
            const arr = Array.isArray(value) ? value : [];
            isForced = question.forcedValues?.includes(o.value) ?? false;
            active = isForced || arr.includes(o.value);
          }

          const handleClick = () => {
            if (isForced) return;
            if (question.type === "single") {
              onChange(o.value);
            } else {
              const arr = Array.isArray(value) ? value : [];
              const checked = !active;
              const next = checked
                ? [...new Set([...arr, o.value])]
                : arr.filter((x) => x !== o.value);
              const forced = question.forcedValues ?? [];
              onChange([...new Set([...forced, ...next])]);
            }
          };

          return (
            <div
              key={o.value}
              onClick={handleClick}
              role={question.type === "single" ? "radio" : "checkbox"}
              aria-checked={active}
              aria-disabled={isForced}
              tabIndex={isForced ? -1 : 0}
              className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer select-none transition-all duration-300 group ${
                isForced ? "opacity-60 cursor-not-allowed" : ""
              } ${
                active
                  ? "bg-accent/5 border-accent glow-emerald"
                  : "bg-obsidian-950/40 border-obsidian-850 hover:border-accent/40 hover:bg-obsidian-900/40"
              }`}
            >
              {/* Custom selection circle/checkbox box visual */}
              <div className="flex items-center justify-center mt-1">
                {question.type === "single" ? (
                  <div className={`h-4 w-4 rounded-full border flex items-center justify-center transition-all ${
                    active ? "border-accent bg-accent" : "border-obsidian-500 bg-transparent group-hover:border-accent/70"
                  }`}>
                    {active && <div className="h-1.5 w-1.5 rounded-full bg-obsidian-950" />}
                  </div>
                ) : (
                  <div className={`h-4 w-4 rounded border flex items-center justify-center transition-all ${
                    active ? "border-accent bg-accent" : "border-obsidian-500 bg-transparent group-hover:border-accent/70"
                  }`}>
                    {active && (
                      <svg className="h-3 w-3 text-obsidian-950 font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                )}
              </div>

              {/* Icon */}
              <div className={`p-2 rounded-lg border transition-all duration-300 mt-0.5 ${
                active
                  ? "bg-accent/15 border-accent/20 text-accent"
                  : "bg-obsidian-900 border-obsidian-850 text-obsidian-400 group-hover:border-accent/20 group-hover:text-accent/80"
              }`}>
                <Icon className="h-5 w-5" />
              </div>

              {/* Title & Help details */}
              <div className="flex-1">
                <h4 className={`text-sm font-semibold transition-colors ${active ? "text-accent" : "text-obsidian-100"}`}>
                  {o.label}
                </h4>
                {sublabel && (
                  <p className="text-xs text-obsidian-400 font-light mt-0.5 leading-relaxed">
                    {sublabel}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
