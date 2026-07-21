import { cn } from "@/lib/utils";

export function TerminalPanel({
  title,
  children,
  className,
  actions,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className={cn("border border-border bg-terminal", className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          {title ? <span className="font-mono-label text-muted-foreground">{title}</span> : <span />}
          {actions}
        </div>
      )}
      <div className="p-4 font-mono text-xs leading-relaxed text-foreground/90">{children}</div>
    </div>
  );
}

export function LogLine({
  time,
  level,
  message,
}: {
  time: string;
  level?: "INFO" | "WARN" | "ERROR";
  message: string;
}) {
  const levelColor =
    level === "ERROR" ? "text-red-400" : level === "WARN" ? "text-amber-400" : "text-muted-foreground";
  return (
    <div className="flex gap-3">
      <span className="shrink-0 text-muted-foreground">[{time}]</span>
      {level ? <span className={cn("shrink-0", levelColor)}>[{level}]</span> : null}
      <span>{message}</span>
    </div>
  );
}
