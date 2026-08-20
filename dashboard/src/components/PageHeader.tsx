import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  className,
  mono = false,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  mono?: boolean;
}) {
  return (
    <div className={cn("flex flex-col gap-4 pb-6 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="space-y-2">
        <h1
          className={cn(
            "text-2xl font-semibold tracking-tight text-white md:text-3xl",
            mono && "font-mono"
          )}
        >
          {title}
        </h1>
        {description ? (
          <p className="max-w-3xl text-xs text-neutral-400">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
