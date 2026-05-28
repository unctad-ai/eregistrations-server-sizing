import { describe, it, expect } from "vitest";
import { BRACKETS, pickBracket } from "@/lib/brackets";

describe("BRACKETS", () => {
  it("defines A, B, C with expected base specs", () => {
    expect(BRACKETS.A).toMatchObject({ id: "A", vcpu: 8, ramGiB: 32, diskGB: 500 });
    expect(BRACKETS.B).toMatchObject({ id: "B", vcpu: 8, ramGiB: 64, diskGB: 1000 });
    expect(BRACKETS.C).toMatchObject({ id: "C", vcpu: 12, ramGiB: 96, diskGB: 2000 });
  });
});

describe("pickBracket", () => {
  it("returns A for avg load <= 1.5", () => {
    expect(pickBracket(1.0).id).toBe("A");
    expect(pickBracket(1.5).id).toBe("A");
  });
  it("returns B for 1.5 < avg <= 2.5", () => {
    expect(pickBracket(1.6).id).toBe("B");
    expect(pickBracket(2.0).id).toBe("B");
    expect(pickBracket(2.5).id).toBe("B");
  });
  it("returns C for avg > 2.5", () => {
    expect(pickBracket(2.6).id).toBe("C");
    expect(pickBracket(3.0).id).toBe("C");
  });
});
