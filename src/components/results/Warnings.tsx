import type { WarningCode } from "@/types";

const MESSAGES: Record<WarningCode, string> = {
  "ha-overkill-for-bracket-a":
    "HA usually only pays off at Bracket B+. For small deployments consider a single server with good backups.",
  "implausible-load-spread":
    "Your answers span a wide load range (e.g. large population but very few applications). Double-check questions 2 and 3 before procuring."
};

export function Warnings({ codes }: { codes: WarningCode[] }) {
  if (codes.length === 0) return null;
  return (
    <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 space-y-1">
      {codes.map((c) => (
        <p key={c}>⚠ {MESSAGES[c]}</p>
      ))}
    </div>
  );
}
