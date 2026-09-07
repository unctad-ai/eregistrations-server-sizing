import type {
  Answers,
  AttachmentLevel,
  BaseSpec,
  EnvironmentCard,
  Environment,
  Horizon,
  Recommendation,
  ServerSpec,
  WarningCode
} from "@/types";
import { pickBracket } from "@/lib/brackets";
import { lookupCloudSkus } from "@/lib/cloud-skus";
import { buildRationale } from "@/lib/rationale";
import { diskMultiplier, externalDatabases, ramReductionGiB } from "@/lib/db-placement";

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
  // Raw product — rounding happens exactly once, after the placement multiplier.
  return base.diskGB * ATTACH_MULT[a.attachments] * HORIZON_MULT[a.horizon];
}

function serverForEnv(base: BaseSpec, diskGB: number, a: Answers, env: Environment): ServerSpec {
  const m = ENV_MULT[env];
  // Database placement applies to production only; dev/test always co-locate
  // their databases on the VM (nobody procures managed databases for dev).
  const ext = env === "production" ? externalDatabases(a) : [];
  const ramGiB = base.ramGiB - (env === "production" ? ramReductionGiB(a) : 0);
  return {
    role: ext.length === 0 ? "all-in-one" : "app",
    vcpu: roundUpToEven(base.vcpu * m.cpu),
    ramGiB: roundUpTo8(ramGiB * m.ram),
    diskGB: roundUpTo(diskGB * m.disk, 250),
    networkGbps: base.networkGbps,
    ...(ext.length > 0 ? { externalDatabases: ext } : {})
  };
}

function computeWarnings(a: Answers): WarningCode[] {
  const w: WarningCode[] = [];
  const scores = [SCORE[a.population]!, SCORE[a.services]!, SCORE[a.applications]!];
  if (Math.max(...scores) - Math.min(...scores) >= 2) {
    w.push("implausible-load-spread");
  }
  return w;
}

export function recommend(answers: Answers): Recommendation {
  const base = pickBracket(avgLoad(answers));
  const baseDisk = adjustedDisk(base, answers);
  const prodDisk = roundUpTo(baseDisk * diskMultiplier(answers), 250);

  const envOrder: Environment[] = ["production", "test", "dev"];
  const cards: EnvironmentCard[] = envOrder
    .filter(env => answers.environments.includes(env))
    .map(env => ({
      env,
      servers: [serverForEnv(base, env === "production" ? prodDisk : baseDisk, answers, env)],
      skus: lookupCloudSkus(base.id)
    }));

  return {
    bracket: base.id,
    cards,
    rationale: buildRationale(answers, base, prodDisk),
    warnings: computeWarnings(answers)
  };
}
