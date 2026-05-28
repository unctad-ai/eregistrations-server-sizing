import * as C from "@radix-ui/react-collapsible";
import { ReactNode, useState } from "react";

export function Collapsible({ trigger, children }: { trigger: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <C.Root open={open} onOpenChange={setOpen}>
      <C.Trigger className="text-sm text-accent hover:underline">
        {open ? "▼" : "▶"} {trigger}
      </C.Trigger>
      <C.Content className="pt-3 text-sm text-slate-700 leading-relaxed">{children}</C.Content>
    </C.Root>
  );
}
