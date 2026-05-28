import * as CB from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";

export function CheckboxItem({
  value,
  label,
  checked,
  onCheckedChange,
  disabled
}: {
  value: string;
  label: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-md border border-slate-200 hover:bg-slate-50">
      <CB.Root
        checked={checked}
        onCheckedChange={(v) => onCheckedChange(v === true)}
        disabled={disabled}
        value={value}
        className="h-4 w-4 rounded border border-slate-400 data-[state=checked]:bg-accent data-[state=checked]:border-accent flex items-center justify-center"
      >
        <CB.Indicator>
          <Check className="h-3 w-3 text-white" />
        </CB.Indicator>
      </CB.Root>
      <span className="text-slate-800">{label}</span>
    </label>
  );
}
