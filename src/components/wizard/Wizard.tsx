import { useState } from "react";
import { useNavigate } from "react-router-dom";
import questionData from "@/data/questions.json";
import type { Answers, Question } from "@/types";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { QuestionStep } from "@/components/wizard/QuestionStep";
import { ServerRack } from "@/components/wizard/ServerRack";
import { encodeAnswers } from "@/lib/state";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";

const QUESTIONS = questionData.questions as Question[];

export function Wizard() {
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Partial<Answers>>({ environments: ["production"] });

  const current = QUESTIONS[idx]!;
  const total = QUESTIONS.length;

  const valueForCurrent = (answers as Record<string, unknown>)[current.id];
  const isAnswered =
    current.type === "single"
      ? typeof valueForCurrent === "string" && valueForCurrent.length > 0
      : Array.isArray(valueForCurrent) && valueForCurrent.length > 0;

  function update(value: string | string[]) {
    setAnswers((a) => ({ ...a, [current.id]: value }));
  }

  function next() {
    if (idx < total - 1) {
      setIdx(idx + 1);
    } else {
      navigate(`/results?state=${encodeAnswers(answers as Answers)}`);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-12 items-start max-w-5xl mx-auto w-full">
      {/* Left Column: Form Question Steps */}
      <div className="lg:col-span-7 space-y-8 glass-panel p-6 sm:p-8 border-obsidian-800/80 shadow-2xl relative">
        <div className="space-y-3.5">
          <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-obsidian-400 font-mono">
            <span>SIZING STEPS</span>
            <span className="text-accent glow-text-emerald">STEP {idx + 1} OF {total}</span>
          </div>
          <Progress value={((idx + 1) / total) * 100} className="h-2 bg-obsidian-950 border border-obsidian-800/60 rounded-full" />
        </div>

        <div className="min-h-[220px] transition-all duration-300">
          <QuestionStep
            question={current}
            value={valueForCurrent as string | string[] | undefined}
            onChange={update}
          />
        </div>

        <div className="flex justify-between pt-6 border-t border-obsidian-800/40">
          <Button
            variant="outline"
            onClick={() => setIdx(Math.max(0, idx - 1))}
            disabled={idx === 0}
            className="border-obsidian-800 hover:border-obsidian-700 bg-obsidian-950 text-obsidian-200 hover:text-white px-4 py-2 hover:bg-obsidian-900 flex items-center gap-2 group transition-all"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            Back
          </Button>
          
          <Button
            onClick={next}
            disabled={!isAnswered}
            className={`px-5 py-2 font-semibold flex items-center gap-2 transition-all border-none ${
              idx === total - 1
                ? "bg-gradient-to-r from-accent to-emerald-500 hover:from-accent/95 hover:to-emerald-500/95 text-obsidian-950 hover:shadow-lg hover:shadow-accent/20"
                : "bg-accent hover:bg-accent/90 text-obsidian-950"
            }`}
          >
            {idx === total - 1 ? (
              <>
                See recommendation
                <CheckCircle2 className="h-4 w-4" />
              </>
            ) : (
              <>
                Next Step
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Right Column: Server Cabinet visualizer */}
      <div className="lg:col-span-5 h-full">
        <ServerRack answers={answers} />
      </div>
    </div>
  );
}
