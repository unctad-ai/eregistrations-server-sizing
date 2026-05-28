import type { Question } from "@/types";
import { RadioGroup, RadioItem } from "@/components/ui/radio-group";
import { CheckboxItem } from "@/components/ui/checkbox";

interface Props {
  question: Question;
  value: string | string[] | undefined;
  onChange: (v: string | string[]) => void;
}

export function QuestionStep({ question, value, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">{question.label}</h2>
        <p className="text-sm text-slate-600 mt-1">{question.help}</p>
      </div>

      {question.type === "single" ? (
        <RadioGroup
          value={typeof value === "string" ? value : ""}
          onValueChange={(v) => onChange(v)}
        >
          {question.options.map((o) => (
            <RadioItem key={o.value} value={o.value} label={o.label} />
          ))}
        </RadioGroup>
      ) : (
        <div className="space-y-2">
          {question.options.map((o) => {
            const arr = Array.isArray(value) ? value : [];
            const isForced = question.forcedValues?.includes(o.value) ?? false;
            const checked = isForced || arr.includes(o.value);
            return (
              <CheckboxItem
                key={o.value}
                value={o.value}
                label={o.label}
                checked={checked}
                disabled={isForced}
                onCheckedChange={(v) => {
                  if (isForced) return;
                  const next = v
                    ? [...new Set([...arr, o.value])]
                    : arr.filter((x) => x !== o.value);
                  const forced = question.forcedValues ?? [];
                  onChange([...new Set([...forced, ...next])]);
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
