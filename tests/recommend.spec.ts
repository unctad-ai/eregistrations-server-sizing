import { describe, it, expect } from "vitest";
import { recommend } from "@/lib/recommend";
import type { Answers } from "@/types";

const baseAnswers: Answers = {
  population: "small",
  services: "small",
  applications: "small",
  attachments: "rarely",
  horizon: "1y",
  environments: ["production"],
  postgresql: "local",
  mongodb: "local"
};

describe("recommend — bracket selection", () => {
  it("selects A for all-small profile", () => {
    expect(recommend(baseAnswers).bracket).toBe("A");
  });

  it("selects B for all-medium profile", () => {
    expect(recommend({
      ...baseAnswers, population: "medium", services: "medium", applications: "medium"
    }).bracket).toBe("B");
  });

  it("selects C for all-large profile", () => {
    expect(recommend({
      ...baseAnswers, population: "large", services: "large", applications: "large"
    }).bracket).toBe("C");
  });

  it("rounds borderline avg = 1.67 to B", () => {
    expect(recommend({ ...baseAnswers, applications: "large" }).bracket).toBe("B");
  });
});

describe("recommend — disk adjustment", () => {
  it("returns base 500 GB for A + rarely + 1y", () => {
    const r = recommend(baseAnswers);
    expect(r.cards[0].servers[0].diskGB).toBe(500);
  });

  it("scales disk for sometimes attachments + 5y horizon (Bracket B)", () => {
    // 1000 * 1.3 * 2.0 = 2600 → rounded up to 2750
    const r = recommend({
      ...baseAnswers,
      population: "medium", services: "medium", applications: "medium",
      attachments: "sometimes", horizon: "5y"
    });
    expect(r.cards[0].servers[0].diskGB).toBe(2750);
  });

  it("scales disk for C + most + 5y", () => {
    // 2000 * 1.8 * 2.0 = 7200 → rounded up to 7250
    const r = recommend({
      ...baseAnswers,
      population: "large", services: "large", applications: "large",
      attachments: "most", horizon: "5y"
    });
    expect(r.cards[0].servers[0].diskGB).toBe(7250);
  });
});

describe("recommend — environment scaling", () => {
  it("emits one production card by default", () => {
    expect(recommend(baseAnswers).cards.map(c => c.env)).toEqual(["production"]);
  });

  it("emits prod + dev + test in order when all selected", () => {
    const r = recommend({ ...baseAnswers, environments: ["production", "dev", "test"] });
    expect(r.cards.map(c => c.env)).toEqual(["production", "test", "dev"]);
  });

  it("scales dev to half CPU/RAM and rounds disk up to 250 step", () => {
    const r = recommend({
      ...baseAnswers,
      population: "medium", services: "medium", applications: "medium",
      environments: ["production", "dev"]
    });
    const dev = r.cards.find(c => c.env === "dev")!;
    expect(dev.servers[0].vcpu).toBe(4);
    expect(dev.servers[0].ramGiB).toBe(32);
    expect(dev.servers[0].diskGB).toBe(500); // 1000*0.3=300 → up to 500
  });

  it("rounds vCPU up to nearest even integer", () => {
    const r = recommend({ ...baseAnswers, environments: ["production", "dev"] });
    expect(r.cards.find(c => c.env === "dev")!.servers[0].vcpu).toBe(4);
  });
});

describe("recommend — database placement", () => {
  const midProfile = { population: "medium", services: "medium", applications: "medium" } as const;

  it("both local → all-in-one role, full spec", () => {
    const s = recommend(baseAnswers).cards[0].servers[0];
    expect(s.role).toBe("all-in-one");
    expect(s.externalDatabases).toBeUndefined();
    expect(s.diskGB).toBe(500);
  });

  it("postgresql external → app role, −25% disk, −8 GB RAM", () => {
    // B: 1000 × 0.75 = 750; 64 − 8 = 56
    const r = recommend({ ...baseAnswers, ...midProfile, postgresql: "external" });
    const s = r.cards[0].servers[0];
    expect(s.role).toBe("app");
    expect(s.externalDatabases).toEqual(["postgresql"]);
    expect(s.diskGB).toBe(750);
    expect(s.ramGiB).toBe(56);
  });

  it("mongodb external → share falls below rounding granularity", () => {
    // B: 1000 × 0.95 = 950 → rounds up to 1000; 64 − 4 = 60 → 64.
    // MongoDB's footprint (9.4 GB on the large reference) is real but smaller
    // than the 250 GB / 8 GiB rounding steps — placement is documented, not sized.
    const r = recommend({ ...baseAnswers, ...midProfile, mongodb: "external" });
    const s = r.cards[0].servers[0];
    expect(s.role).toBe("app");
    expect(s.externalDatabases).toEqual(["mongodb"]);
    expect(s.diskGB).toBe(1000);
    expect(s.ramGiB).toBe(64);
  });

  it("both external → ×0.70 disk, −12 GB RAM", () => {
    // B: 1000 × 0.70 = 700 → 750; 64 − 12 = 52 → 56
    const r = recommend({ ...baseAnswers, ...midProfile, postgresql: "external", mongodb: "external" });
    const s = r.cards[0].servers[0];
    expect(s.role).toBe("app");
    expect(s.externalDatabases).toEqual(["postgresql", "mongodb"]);
    expect(s.diskGB).toBe(750);
    expect(s.ramGiB).toBe(56);
  });

  it("vCPU is unaffected by placement", () => {
    const r = recommend({ ...baseAnswers, ...midProfile, postgresql: "external", mongodb: "external" });
    expect(r.cards[0].servers[0].vcpu).toBe(8);
  });

  it("placement does not affect dev/test cards", () => {
    const r = recommend({
      ...baseAnswers,
      ...midProfile,
      environments: ["production", "dev", "test"],
      postgresql: "external",
      mongodb: "external"
    });
    for (const envName of ["dev", "test"] as const) {
      const card = r.cards.find(c => c.env === envName)!;
      expect(card.servers[0].role).toBe("all-in-one");
      expect(card.servers[0].externalDatabases).toBeUndefined();
      expect(card.servers[0].ramGiB).toBe(32); // 64 × 0.5
      expect(card.servers[0].diskGB).toBe(500); // 1000 × 0.3 = 300 → 500
    }
  });

  it("rounds once after the placement multiplier (non-aligned profile)", () => {
    // A + sometimes + 1y: raw 650. Local → 750; PG external → 650 × 0.75 = 487.5 → 500.
    // Double-rounding (750 × 0.75 → 750) would make placement a no-op here.
    const local = recommend({ ...baseAnswers, attachments: "sometimes" });
    const ext = recommend({ ...baseAnswers, attachments: "sometimes", postgresql: "external" });
    expect(local.cards[0].servers[0].diskGB).toBe(750);
    expect(ext.cards[0].servers[0].diskGB).toBe(500);
  });

  it("emits exactly one server per environment", () => {
    const r = recommend({ ...baseAnswers, environments: ["production", "dev", "test"] });
    expect(r.cards.every(c => c.servers.length === 1)).toBe(true);
  });
});

describe("recommend — warnings", () => {
  it("warns when load proxies span min and max scores", () => {
    const r = recommend({ ...baseAnswers, applications: "large" });
    expect(r.warnings).toContain("implausible-load-spread");
  });

  it("does not warn on close load proxies", () => {
    const r = recommend({ ...baseAnswers, applications: "medium" });
    expect(r.warnings).not.toContain("implausible-load-spread");
  });
});

describe("recommend — anchor fixtures", () => {
  it("small-country profile → Bracket A, single card", () => {
    const r = recommend({
      population: "small", services: "small", applications: "small",
      attachments: "sometimes", horizon: "1y",
      environments: ["production"], postgresql: "local", mongodb: "local"
    });
    expect(r.bracket).toBe("A");
    expect(r.cards).toHaveLength(1);
    // 500 * 1.3 * 1.0 = 650 → rounded up to 750
    expect(r.cards[0].servers[0]).toMatchObject({ vcpu: 8, ramGiB: 32, diskGB: 750 });
  });

  it("large-country profile → Bracket C, disk >= 2000", () => {
    const r = recommend({
      population: "medium", services: "large", applications: "large",
      attachments: "most", horizon: "5y",
      environments: ["production"], postgresql: "local", mongodb: "local"
    });
    expect(r.bracket).toBe("C");
    expect(r.cards[0].servers[0].vcpu).toBe(12);
    expect(r.cards[0].servers[0].ramGiB).toBe(96);
    expect(r.cards[0].servers[0].diskGB).toBeGreaterThanOrEqual(2000);
  });

  it("mid-default profile → Bracket B, 3 cards", () => {
    const r = recommend({
      population: "medium", services: "medium", applications: "medium",
      attachments: "sometimes", horizon: "3y",
      environments: ["production", "dev", "test"], postgresql: "local", mongodb: "local"
    });
    expect(r.bracket).toBe("B");
    expect(r.cards.map(c => c.env)).toEqual(["production", "test", "dev"]);
  });
});

describe("recommend — rationale and SKUs are populated", () => {
  it("populates rationale string", () => {
    const r = recommend(baseAnswers);
    expect(r.rationale).toMatch(/Bracket A/);
  });

  it("populates cloud SKUs from bracket", () => {
    const r = recommend(baseAnswers);
    expect(r.cards[0].skus.aws).toMatch(/m6i\.2xlarge/);
  });
});
