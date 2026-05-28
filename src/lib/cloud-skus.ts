import type { BracketId, CloudSkus } from "@/types";

const SKUS: Record<BracketId, CloudSkus> = {
  A: {
    aws: "m6i.2xlarge (8 vCPU / 32 GiB)",
    hetzner: "CCX23 (8 / 32)",
    ovh: "Advance-1"
  },
  B: {
    aws: "r6i.2xlarge (8 vCPU / 64 GiB)",
    hetzner: "CCX33 (8 / 64)",
    ovh: "Advance-2"
  },
  C: {
    aws: "r6i.4xlarge (16 vCPU / 128 GiB, slightly over)",
    hetzner: "CCX43 (16 / 64) or CCX53 (16 / 128)",
    ovh: "HG-2"
  }
};

export function lookupCloudSkus(bracket: BracketId): CloudSkus {
  return SKUS[bracket];
}
