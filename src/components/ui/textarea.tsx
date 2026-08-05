import * as React from 'react'
import { cn } from '@/lib/utils'

// ForgeFitOS Textarea (Phase 4B.1) — mirrors Input's state system
// (focus-visible ring, aria-invalid, disabled, read-only). Existing
// raw <textarea> usages migrate route by route in later 4B phases.

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 read-only:bg-[hsl(var(--surface))] read-only:text-[hsl(var(--text-secondary))] aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30',
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
