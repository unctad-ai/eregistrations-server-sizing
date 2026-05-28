import type {
  Answers,
  AttachmentLevel,
  BaseSpec,
  EnvironmentCard,
  Environment,
  Horizon,
  Recommendation,
  ServerSpec,
  Topology,
  WarningCode
} from "@/types";
import { pickBracket } from "@/lib/brackets";
import { lookupCloudSkus } from "@/lib/cloud-skus";
import { buildRationale } from "@/lib/rationale";

const SCORE: Record<string, 1 | 2 | 3> = { small: 1, medium: 2, large: 3 };
const ATTACH_MULT: Record<AttachmentLevel, number> = { rarely: 1.0, sometimes: 1.3, most: 1.8 };
const HORIZON_MULT: Record<Horizon, number> = { "1y": 1.0, "3y": 1.5, "5y": 2.0 };
const ENV_MULT: Record<Environment, { cpu: number; ram: number; disk: number }> = {
  production: { cpu: 1.0, ram: 1.0, disk: 1.0 },
  dev: { cpu: 0.5, ram: 0.5, disk: 0.3 },
  test: { cpu: 0.5, ram: 0.5, disk: 0.3 }
};

function avgLoad(a: Answers): number {
  return (SCORE[a.population]! + SCORE[a.services]! + SCORE[a.applications]!) / 3;
}

function roundUpTo(n: number, step: number): number {
  return Math.ceil(n / step) * step;
}

function roundUpToEven(n: number): number {
  return Math.ceil(n / 2) * 2;
}

function roundUpTo8(n: number): number {
  return Math.ceil(n / 8) * 8;
}

function adjustedDisk(base: BaseSpec, a: Answers): number {
  const raw = base.diskGB * ATTACH_MULT[a.attachments] * HORIZON_MULT[a.horizon];
  return roundUpTo(raw, 250);
}

function scaleServer(base: BaseSpec, prodDisk: number, env: Environment): ServerSpec {
  const m = ENV_MULT[env];
  return {
    role: "all-in-one",
    vcpu: roundUpToEven(base.vcpu * m.cpu),
    ramGiB: roundUpTo8(base.ramGiB * m.ram),
    diskGB: roundUpTo(prodDisk * m.disk, 250),
    networkGbps: base.networkGbps
  };
}

function serversForTopology(topology: Topology, scaled: ServerSpec): ServerSpec[] {
  if (topology === "single") {
    return [{ ...scaled, role: "all-in-one" }];
  }
  const appDisk = roundUpTo(scaled.diskGB / 3, 250);
  const dbDisk = roundUpTo((scaled.diskGB * 2) / 3, 250);
  const dbCpu = roundUpToEven(scaled.vcpu / 2);

  if (topology === "split-db") {
    return [
      { ...scaled, role: "app", diskGB: appDisk },
      { ...scaled, role: "db", vcpu: dbCpu, diskGB: dbDisk }
    ];
  }
  // ha
  return [
    { ...scaled, role: "app-1", diskGB: appDisk },
    { ...scaled, role: "app-2", diskGB: appDisk },
    { ...scaled, role: "db-1", vcpu: dbCpu, diskGB: dbDisk },
    { ...scaled, role: "db-2", vcpu: dbCpu, diskGB: dbDisk }
  ];
}

function computeWarnings(a: Answers, base: BaseSpec): WarningCode[] {
  const w: WarningCode[] = [];
  if (a.topology === "ha" && base.id === "A") {
    w.push("ha-overkill-for-bracket-a");
  }
  const scores = [SCORE[a.population]!, SCORE[a.services]!, SCORE[a.applications]!];
  if (Math.max(...scores) - Math.min(...scores) >= 2) {
    w.push("implausible-load-spread");
  }
  return w;
}

export function recommend(answers: Answers): Recommendation {
  const base = pickBracket(avgLoad(answers));
  const prodDisk = adjustedDisk(base, answers);

  const envOrder: Environment[] = ["production", "dev", "test"];
  const cards: EnvironmentCard[] = envOrder
    .filter(env => answers.environments.includes(env))
    .map(env => ({
      env,
      servers: serversForTopology(answers.topology, scaleServer(base, prodDisk, env)),
      skus: lookupCloudSkus(base.id)
    }));

  return {
    bracket: base.id,
    cards,
    rationale: buildRationale(answers, base, prodDisk),
    warnings: computeWarnings(answers, base)
  };
}
