import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center rounded-lg border text-xs font-medium transition-all outline-none select-none focus-visible:ring-1 focus-visible:ring-neutral-400 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-white bg-white text-black font-semibold hover:bg-neutral-200 shadow-sm",
        outline:
          "border-neutral-800 bg-neutral-950 text-neutral-200 hover:bg-neutral-900 hover:text-white",
        secondary:
          "border-neutral-800 bg-neutral-900 text-neutral-200 hover:bg-neutral-800 hover:text-white",
        ghost:
          "border-transparent text-neutral-400 hover:bg-neutral-900 hover:text-white",
        destructive:
          "border-rose-600/40 bg-rose-600/10 text-rose-400 hover:bg-rose-600/20",
        link:
          "border-transparent text-white underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        xs: "h-6 px-2 text-[11px]",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-5 text-sm font-semibold",
        icon: "size-9",
        "icon-xs": "size-6",
        "icon-sm": "size-7",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>
>(function Button(
  { className, variant = "default", size = "default", type = "button", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button, buttonVariants }
