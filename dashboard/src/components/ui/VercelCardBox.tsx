import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface VercelCardBoxProps {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footerLeft?: ReactNode;
  footerAction?: ReactNode;
  danger?: boolean;
  className?: string;
}

export function VercelCardBox({
  title,
  description,
  children,
  footerLeft,
  footerAction,
  danger = false,
  className,
}: VercelCardBoxProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-[#0a0a0a] transition-colors",
        danger
          ? "border-red-900/40 hover:border-red-800/60"
          : "border-neutral-800 hover:border-neutral-700/80",
        className
      )}
    >
      <div className="p-6 space-y-4">
        <div>
          <h3
            className={cn(
              "text-base font-semibold",
              danger ? "text-red-400" : "text-white"
            )}
          >
            {title}
          </h3>
          {description && (
            <p className="mt-1 text-xs text-neutral-400 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        <div className="pt-1">{children}</div>
      </div>

      {(footerLeft !== undefined || footerAction !== undefined) && (
        <div
          className={cn(
            "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t px-6 py-3 text-xs",
            danger
              ? "border-red-950/60 bg-red-950/10 text-red-300/80"
              : "border-neutral-800 bg-neutral-950/80 text-neutral-400"
          )}
        >
          <div className="min-w-0 text-xs text-neutral-400">{footerLeft}</div>
          {footerAction && <div className="shrink-0">{footerAction}</div>}
        </div>
      )}
    </div>
  );
}
