import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-lg border border-neutral-800 bg-black px-3 py-1 text-xs text-white placeholder:text-neutral-500 focus-visible:border-neutral-500 focus-visible:ring-1 focus-visible:ring-neutral-500 outline-none transition-colors disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
