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
  topology: "split-db"
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
});
