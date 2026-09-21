import { cn } from "@/lib/utils";

export const settingsInputClass = cn(
  "h-9 w-full rounded-md border border-neutral-800 bg-black px-3 text-xs text-neutral-200 placeholder:text-neutral-600 outline-none transition-colors",
  "focus-visible:border-neutral-500 focus-visible:ring-1 focus-visible:ring-neutral-500",
  "disabled:cursor-not-allowed disabled:opacity-50"
);
