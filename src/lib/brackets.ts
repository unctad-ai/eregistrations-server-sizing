import type { BaseSpec, BracketId } from "@/types";

export const BRACKETS: Record<BracketId, BaseSpec> = {
  A: { id: "A", label: "Small", vcpu: 8, ramGiB: 32, diskGB: 500, networkGbps: 1 },
  B: { id: "B", label: "Mid", vcpu: 8, ramGiB: 64, diskGB: 1000, networkGbps: 1 },
  C: { id: "C", label: "Large", vcpu: 12, ramGiB: 96, diskGB: 2000, networkGbps: 1 }
};

export function pickBracket(avgLoad: number): BaseSpec {
  if (avgLoad <= 1.5) return BRACKETS.A;
  if (avgLoad <= 2.5) return BRACKETS.B;
  return BRACKETS.C;
}
