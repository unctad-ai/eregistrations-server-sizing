import { describe, it, expect } from "vitest";
import { portsForServer, formatPorts } from "@/lib/ports";

describe("portsForServer", () => {
  it("exposes exactly 22/80/443 publicly", () => {
    const pub = portsForServer({}).filter(r => r.exposure === "public").map(r => r.port);
    expect(pub).toEqual([22, 80, 443]);
  });

  it("includes database ports as internal when both databases are local", () => {
    const rules = portsForServer({ externalDatabases: [] });
    expect(rules.find(r => r.port === 5432)?.exposure).toBe("internal");
    expect(rules.find(r => r.port === 27017)?.exposure).toBe("internal");
    expect(rules.find(r => r.port === 6379)?.exposure).toBe("localhost");
    expect(rules.find(r => r.port === 8444)?.exposure).toBe("internal");
  });

  it("omits PostgreSQL port when externally managed", () => {
    const rules = portsForServer({ externalDatabases: ["postgresql"] });
    expect(rules.find(r => r.port === 5432)).toBeUndefined();
    expect(rules.find(r => r.port === 27017)).toBeDefined();
  });

  it("omits both database ports when both are external", () => {
    const rules = portsForServer({ externalDatabases: ["postgresql", "mongodb"] });
    expect(rules.find(r => r.port === 5432)).toBeUndefined();
    expect(rules.find(r => r.port === 27017)).toBeUndefined();
  });
});

describe("formatPorts", () => {
  it("leads with the public ports", () => {
    expect(formatPorts(portsForServer({}))).toMatch(/^22, 80, 443 public · /);
  });
});
