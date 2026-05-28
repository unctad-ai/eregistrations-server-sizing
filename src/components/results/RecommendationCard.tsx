import type { EnvironmentCard, ServerRole } from "@/types";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

const ENV_LABEL: Record<EnvironmentCard["env"], string> = {
  production: "Production",
  dev: "Development",
  test: "Test / QA"
};

const ROLE_LABEL: Record<ServerRole, string> = {
  "all-in-one": "Single server",
  app: "Application server",
  db: "Database server",
  "app-1": "Application server 1",
  "app-2": "Application server 2",
  "db-1": "Database server 1",
  "db-2": "Database server 2"
};

export function RecommendationCard({ card }: { card: EnvironmentCard }) {
  return (
    <Card className="break-inside-avoid">
      <CardHeader>
        <h3 className="text-lg font-semibold text-slate-900">{ENV_LABEL[card.env]}</h3>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-3">
          {card.servers.map((s, i) => (
            <li key={i} className="border-l-2 border-accent pl-4">
              <div className="text-sm font-medium text-slate-700">{ROLE_LABEL[s.role]}</div>
              <div className="text-sm text-slate-600">
                {s.vcpu} vCPU · {s.ramGiB} GiB RAM · {s.diskGB} GB NVMe SSD · {s.networkGbps} Gbps
              </div>
            </li>
          ))}
        </ul>

        <div className="pt-3 border-t border-slate-100 text-sm">
          <div className="text-xs uppercase tracking-wider text-slate-500 mb-2">Cloud equivalents</div>
          <ul className="text-slate-700 space-y-1">
            <li><span className="font-medium">AWS:</span> {card.skus.aws}</li>
            <li><span className="font-medium">Hetzner:</span> {card.skus.hetzner}</li>
            <li><span className="font-medium">OVH:</span> {card.skus.ovh}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
