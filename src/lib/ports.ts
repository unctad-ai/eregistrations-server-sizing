import type { DatabaseKind, ServerSpec } from "@/types";

export type PortExposure = "public" | "internal" | "localhost";

export interface PortRule {
  port: number;
  service: string;
  exposure: PortExposure;
  note: string;
}

// Ground truth from eregistrations-installer: UFW default-deny on the app
// server (roles/firewall/tasks/main.yml); DB services bind to Docker/private
// ranges only (roles/firewall/defaults/main.yml); edge proxy is HAProxy.
const BASE_RULES: PortRule[] = [
  { port: 22, service: "SSH", exposure: "public", note: "administration" },
  { port: 80, service: "HTTP", exposure: "public", note: "redirects to HTTPS; must stay reachable for Let's Encrypt issuance" },
  { port: 443, service: "HTTPS", exposure: "public", note: "HAProxy edge — serves all six platform subdomains" },
  { port: 8444, service: "HAProxy stats", exposure: "internal", note: "monitoring/VPN only — blocked from the internet" }
];

const DB_RULES: Record<DatabaseKind, PortRule> = {
  postgresql: { port: 5432, service: "PostgreSQL", exposure: "internal", note: "reachable from the app tier only" },
  mongodb: { port: 27017, service: "MongoDB", exposure: "internal", note: "reachable from the app tier only" }
};

const REDIS_RULE: PortRule = {
  port: 6379,
  service: "Redis",
  exposure: "localhost",
  note: "loopback and Docker network only"
};

export function portsForServer(server: Pick<ServerSpec, "externalDatabases">): PortRule[] {
  const external = server.externalDatabases ?? [];
  const dbRules = (["postgresql", "mongodb"] as const)
    .filter(db => !external.includes(db))
    .map(db => DB_RULES[db]);
  return [...BASE_RULES, ...dbRules, REDIS_RULE];
}

export function formatPorts(rules: PortRule[]): string {
  const pub = rules
    .filter(r => r.exposure === "public")
    .map(r => r.port)
    .join(", ");
  const rest = rules
    .filter(r => r.exposure !== "public")
    .map(r => `${r.port} ${r.service} (${r.exposure})`)
    .join(" · ");
  return `${pub} public · ${rest}`;
}
