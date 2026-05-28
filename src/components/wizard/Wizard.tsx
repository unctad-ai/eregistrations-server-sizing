import { useState } from "react";
import { useNavigate } from "react-router-dom";
import questionData from "@/data/questions.json";
import type { Answers, Question } from "@/types";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { QuestionStep } from "@/components/wizard/QuestionStep";
import { encodeAnswers } from "@/lib/state";

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
    <div className="space-y-8">
      <div className="space-y-2">
        <Progress value={((idx + 1) / total) * 100} />
        <p className="text-sm text-slate-500">Question {idx + 1} of {total}</p>
      </div>

      <QuestionStep
        question={current}
        value={valueForCurrent as string | string[] | undefined}
        onChange={update}
      />

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0}>
          ← Back
        </Button>
        <Button onClick={next} disabled={!isAnswered}>
          {idx === total - 1 ? "See recommendation →" : "Next →"}
        </Button>
      </div>
    </div>
  );
}
