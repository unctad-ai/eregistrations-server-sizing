import { describe, it, expect } from "vitest";
import { encodeAnswers, decodeAnswers } from "@/lib/state";
import type { Answers } from "@/types";

const sample: Answers = {
  population: "medium",
  services: "medium",
  applications: "large",
  attachments: "sometimes",
  horizon: "3y",
  environments: ["production", "dev"],
  postgresql: "local",
  mongodb: "external"
};

describe("state encoding", () => {
  it("round-trips Answers through URL-safe base64", () => {
    const encoded = encodeAnswers(sample);
    expect(encoded).not.toContain("+");
    expect(encoded).not.toContain("/");
    expect(encoded).not.toContain("=");
    expect(decodeAnswers(encoded)).toEqual(sample);
  });

  it("returns null for malformed input", () => {
    expect(decodeAnswers("garbage!!")).toBeNull();
  });

  it("returns null for stale links missing database placement", () => {
    const stale = { ...sample } as Record<string, unknown>;
    delete stale.postgresql;
    delete stale.mongodb;
    stale.topology = "ha"; // legacy field from the topology-era model
    const encoded = btoa(JSON.stringify(stale)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    expect(decodeAnswers(encoded)).toBeNull();
  });
});
