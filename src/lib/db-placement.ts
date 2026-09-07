import type { Answers, DatabaseKind } from "@/types";

// Anchored in the reference deployments: PostgreSQL data plus its nightly dump
// generations account for ~25% of the disk allowance, MongoDB for ~5%.
// RAM: MongoDB wiredTiger cache defaults to 4 GiB in the installer;
// PostgreSQL's effective share on an untuned host is ~8 GiB.
export const DB_DISK_SHARE: Record<DatabaseKind, number> = {
  postgresql: 0.25,
  mongodb: 0.05
};

export const DB_RAM_GIB: Record<DatabaseKind, number> = {
  postgresql: 8,
  mongodb: 4
};

type Placement = Pick<Answers, "postgresql" | "mongodb">;

export function externalDatabases(a: Placement): DatabaseKind[] {
  const out: DatabaseKind[] = [];
  if (a.postgresql === "external") out.push("postgresql");
  if (a.mongodb === "external") out.push("mongodb");
  return out;
}

export function diskMultiplier(a: Placement): number {
  return 1 - externalDatabases(a).reduce((sum, db) => sum + DB_DISK_SHARE[db], 0);
}

export function ramReductionGiB(a: Placement): number {
  return externalDatabases(a).reduce((sum, db) => sum + DB_RAM_GIB[db], 0);
}
