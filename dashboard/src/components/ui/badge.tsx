import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-medium whitespace-nowrap transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
        secondary:
          "border-neutral-800 bg-neutral-900 text-neutral-300",
        destructive:
          "border-rose-500/30 bg-rose-500/10 text-rose-400",
        outline:
          "border-neutral-800 text-neutral-300",
        ghost:
          "border-transparent text-neutral-400 hover:bg-neutral-900",
        link: "text-white underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
