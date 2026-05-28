import { useMemo } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { decodeAnswers } from "@/lib/state";
import { recommend } from "@/lib/recommend";
import { RecommendationCard } from "@/components/results/RecommendationCard";
import { RationaleBlock } from "@/components/results/RationaleBlock";
import { Warnings } from "@/components/results/Warnings";
import { Button } from "@/components/ui/button";

export function Results() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const encoded = params.get("state");
  const answers = useMemo(() => (encoded ? decodeAnswers(encoded) : null), [encoded]);

  if (!answers) {
    return (
      <div className="space-y-4">
        <p>No answers found in URL.</p>
        <Button onClick={() => navigate("/wizard")}>Start over</Button>
      </div>
    );
  }

  const r = recommend(answers);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Recommended configuration</h1>
        <p className="text-slate-700">
          Based on your answers, you fall into <strong>Bracket {r.bracket}</strong>.
        </p>
      </header>

      <Warnings codes={r.warnings} />

      <div className="grid gap-6 md:grid-cols-2">
        {r.cards.map((c) => (
          <RecommendationCard key={c.env} card={c} />
        ))}
      </div>

      <div className="flex flex-wrap gap-3 print:hidden">
        <Button onClick={() => window.print()}>Print / Save as PDF</Button>
        <Button
          variant="outline"
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
          }}
        >
          Copy share link
        </Button>
        <Link to="/wizard">
          <Button variant="ghost">← Edit answers</Button>
        </Link>
      </div>

      <RationaleBlock rationale={r.rationale} />
    </div>
  );
}
