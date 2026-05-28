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
  topology: "single"
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

describe("recommend — topology", () => {
  it("single emits 1 all-in-one server per env", () => {
    const r = recommend(baseAnswers);
    expect(r.cards[0].servers.map(s => s.role)).toEqual(["all-in-one"]);
  });

  it("split-db emits 1 app + 1 db server per env", () => {
    const r = recommend({ ...baseAnswers, topology: "split-db" });
    expect(r.cards[0].servers.map(s => s.role)).toEqual(["app", "db"]);
    expect(r.cards[0].servers[0].vcpu).toBe(8);
    expect(r.cards[0].servers[0].ramGiB).toBe(32);
    expect(r.cards[0].servers[1].vcpu).toBe(4);
    expect(r.cards[0].servers[1].ramGiB).toBe(32);
  });

  it("ha emits 2 app + 2 db servers per env", () => {
    const r = recommend({ ...baseAnswers, topology: "ha" });
    expect(r.cards[0].servers.map(s => s.role)).toEqual(["app-1", "app-2", "db-1", "db-2"]);
  });
});

describe("recommend — warnings", () => {
  it("warns on ha + Bracket A", () => {
    const r = recommend({ ...baseAnswers, topology: "ha" });
    expect(r.warnings).toContain("ha-overkill-for-bracket-a");
  });

  it("does not warn on ha + Bracket B", () => {
    const r = recommend({
      ...baseAnswers,
      population: "medium", services: "medium", applications: "medium",
      topology: "ha"
    });
    expect(r.warnings).not.toContain("ha-overkill-for-bracket-a");
  });

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
      environments: ["production"], topology: "single"
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
      environments: ["production"], topology: "single"
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
      environments: ["production", "dev", "test"], topology: "single"
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
