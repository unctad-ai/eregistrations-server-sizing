import type { Answers, BaseSpec, AttachmentLevel, Horizon } from "@/types";

const SCORE: Record<string, number> = { small: 1, medium: 2, large: 3 };
const ATTACH_MULT: Record<AttachmentLevel, number> = { rarely: 1.0, sometimes: 1.3, most: 1.8 };
const HORIZON_MULT: Record<Horizon, number> = { "1y": 1.0, "3y": 1.5, "5y": 2.0 };

export function buildRationale(answers: Answers, base: BaseSpec, finalDiskGB: number): string {
  const popScore = SCORE[answers.population]!;
  const svcScore = SCORE[answers.services]!;
  const appScore = SCORE[answers.applications]!;
  const avg = (popScore + svcScore + appScore) / 3;
  const attachMult = ATTACH_MULT[answers.attachments];
  const horizonMult = HORIZON_MULT[answers.horizon];

  return [
    `Population (${popScore}) + Services (${svcScore}) + Applications (${appScore}) → avg ${avg.toFixed(1)} → Bracket ${base.id} (${base.label}).`,
    `Disk: base ${base.diskGB} GB × attachments ×${attachMult.toFixed(1)} × horizon ×${horizonMult.toFixed(1)} → ${finalDiskGB} GB.`,
    `Network: ${base.networkGbps} Gbps (default).`
  ].join(" ");
}
