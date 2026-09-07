import type { Answers } from "@/types";

function toUrlSafe(b64: string): string {
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromUrlSafe(s: string): string {
  return s.replace(/-/g, "+").replace(/_/g, "/");
}

export function encodeAnswers(answers: Answers): string {
  return toUrlSafe(btoa(JSON.stringify(answers)));
}

export function decodeAnswers(encoded: string): Answers | null {
  try {
    const json = atob(fromUrlSafe(encoded));
    if (!json.trim().startsWith("{")) return null;
    const parsed = JSON.parse(json) as Record<string, unknown>;
    // Reject stale share links from before the database-placement model.
    if (parsed.postgresql !== "local" && parsed.postgresql !== "external") return null;
    if (parsed.mongodb !== "local" && parsed.mongodb !== "external") return null;
    return parsed as unknown as Answers;
  } catch {
    return null;
  }
}
