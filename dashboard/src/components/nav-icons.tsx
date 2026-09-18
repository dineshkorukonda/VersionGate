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
