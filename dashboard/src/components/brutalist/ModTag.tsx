import { cn } from "@/lib/utils";

export function ModTag({ label, className }: { label: string; className?: string }) {
  return (
    <span className={cn("font-mono text-[10px] uppercase tracking-widest text-muted-foreground", className)}>
      {label}
    </span>
  );
}
