import * as RG from "@radix-ui/react-radio-group";
import { cn } from "@/lib/cn";
import { ReactNode } from "react";

export function RadioGroup(props: RG.RadioGroupProps & { children: ReactNode }) {
  const { className, children, ...rest } = props;
  return (
    <RG.Root {...rest} className={cn("space-y-2", className)}>
      {children}
    </RG.Root>
  );
}

export function RadioItem({ value, label }: { value: string; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-md border border-slate-200 hover:bg-slate-50">
      <RG.Item
        value={value}
        className="h-4 w-4 rounded-full border border-slate-400 data-[state=checked]:bg-accent data-[state=checked]:border-accent flex items-center justify-center"
      >
        <RG.Indicator className="block h-2 w-2 rounded-full bg-white" />
      </RG.Item>
      <span className="text-slate-800">{label}</span>
    </label>
  );
}
