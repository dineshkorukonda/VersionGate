import { cn } from "@/lib/utils";

type IconProps = { className?: string };

export function NavIconGrid({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={cn("size-4 shrink-0", className)} aria-hidden>
      <rect x="1" y="1" width="6" height="6" rx="1" />
      <rect x="9" y="1" width="6" height="6" rx="1" />
      <rect x="1" y="9" width="6" height="6" rx="1" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
    </svg>
  );
}

export function NavIconFolder({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn("size-4 shrink-0", className)} aria-hidden>
      <path d="M2 4.5h4l1.5 1.5H14v7H2z" />
    </svg>
  );
}

export function NavIconRocket({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn("size-4 shrink-0", className)} aria-hidden>
      <path d="M8 13V8M5 3l3 2 3-2M5 3v3.5a3 3 0 0 0 6 0V3" />
    </svg>
  );
}

export function NavIconLogs({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn("size-4 shrink-0", className)} aria-hidden>
      <path d="M3 4h10M3 8h10M3 12h6" />
    </svg>
  );
}

export function NavIconDatabase({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn("size-4 shrink-0", className)} aria-hidden>
      <ellipse cx="8" cy="4" rx="5" ry="2" />
      <path d="M3 4v4c0 1.1 2.24 2 5 2s5-.9 5-2V4M3 8v4c0 1.1 2.24 2 5 2s5-.9 5-2V8" />
    </svg>
  );
}

export function NavIconClock({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn("size-4 shrink-0", className)} aria-hidden>
      <circle cx="8" cy="8" r="5.5" />
      <path d="M8 5v3.5l2.5 1.5" />
    </svg>
  );
}

export function NavIconPlug({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn("size-4 shrink-0", className)} aria-hidden>
      <path d="M5 3v3M11 3v3M3 8h10v4H3z" />
    </svg>
  );
}

export function NavIconPulse({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn("size-4 shrink-0", className)} aria-hidden>
      <path d="M2 10h2l1.5-4 2 8 2-5 1.5 3H14" />
    </svg>
  );
}

export function NavIconSettings({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn("size-4 shrink-0", className)} aria-hidden>
      <circle cx="8" cy="8" r="2" />
      <path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1" />
    </svg>
  );
}

export function NavIconChevron({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn("size-3 shrink-0 opacity-50", className)} aria-hidden>
      <path d="M6 4l4 4-4 4" />
    </svg>
  );
}

export function NavIconSearch({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn("size-3.5 shrink-0 opacity-50", className)} aria-hidden>
      <circle cx="7" cy="7" r="4" />
      <path d="M10 10l3 3" />
    </svg>
  );
}

export function NavIconGlobe({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn("size-4 shrink-0", className)} aria-hidden>
      <circle cx="8" cy="8" r="6" />
      <path d="M2 8h12M8 2a9 9 0 0 1 3 6 9 9 0 0 1-3 6 9 9 0 0 1-3-6 9 9 0 0 1 3-6z" />
    </svg>
  );
}

export function NavIconKey({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn("size-4 shrink-0", className)} aria-hidden>
      <circle cx="5.5" cy="8" r="3" />
      <path d="M8.5 8h5.5M11.5 8v2M13 8v1.5" />
    </svg>
  );
}

export function NavIconShield({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn("size-4 shrink-0", className)} aria-hidden>
      <path d="M8 2l5 2v4c0 3.5-3 5.5-5 6-2-.5-5-2.5-5-6V4l5-2z" />
    </svg>
  );
}

export function NavIconSparkle({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={cn("size-3.5 shrink-0", className)} aria-hidden>
      <path d="M8 1a.75.75 0 0 1 .71.51l1.19 3.58 3.58 1.2a.75.75 0 0 1 0 1.42l-3.58 1.2-1.19 3.58a.75.75 0 0 1-1.42 0l-1.2-3.58-3.57-1.2a.75.75 0 0 1 0-1.42l3.58-1.2 1.19-3.58A.75.75 0 0 1 8 1z" />
    </svg>
  );
}

export function NavIconChevronsUpDown({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn("size-3.5 shrink-0 text-neutral-500", className)} aria-hidden>
      <path d="M5 6l3-3 3 3M5 10l3 3 3-3" />
    </svg>
  );
}

export function NavIconArrowLeft({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn("size-3.5 shrink-0", className)} aria-hidden>
      <path d="M10 3L5 8l5 5" />
    </svg>
  );
}

export function NavIconCheck({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className={cn("size-3.5 shrink-0", className)} aria-hidden>
      <path d="M3.5 8.5l3 3 6-7" />
    </svg>
  );
}

export function NavIconList({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn("size-4 shrink-0", className)} aria-hidden>
      <path d="M2.5 4h11M2.5 8h11M2.5 12h11" />
    </svg>
  );
}

export function NavIconGithub({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={cn("size-4 shrink-0", className)} aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
      />
    </svg>
  );
}

export function NavIconGitBranch({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn("size-3.5 shrink-0", className)} aria-hidden>
      <circle cx="5" cy="4" r="1.75" />
      <circle cx="5" cy="12" r="1.75" />
      <circle cx="11" cy="6" r="1.75" />
      <path d="M5 5.75v4.5M5 8c2.5 0 3.5-.75 6-2" />
    </svg>
  );
}

export function NavIconExternal({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn("size-3 shrink-0", className)} aria-hidden>
      <path d="M6 3h7v7M13 3L6.5 9.5" />
    </svg>
  );
}
