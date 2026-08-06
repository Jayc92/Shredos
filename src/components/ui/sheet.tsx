'use client'

// ============================================================
// ForgeFitOS — Sheet primitive (Phase 4B.2)
//
// Bottom sheet built on the Radix Dialog primitive from the
// already-installed `radix-ui` package — no new dependency. Radix
// supplies the dialog semantics the More surface needs: focus trap
// while open, Escape to close, outside click to close, focus
// returned to the trigger, body scroll lock, and aria-modal wiring.
// Every SheetContent must contain a SheetTitle (accessible name).
// ============================================================

import * as React from 'react'
import { Dialog } from 'radix-ui'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const Sheet = Dialog.Root
const SheetTrigger = Dialog.Trigger
const SheetClose = Dialog.Close

const SheetContent = React.forwardRef<
  React.ElementRef<typeof Dialog.Content>,
  React.ComponentPropsWithoutRef<typeof Dialog.Content>
>(({ className, children, ...props }, ref) => (
  <Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-50 bg-[hsl(var(--overlay))]/60" />
    <Dialog.Content
      ref={ref}
      className={cn(
        'fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-[var(--radius-panel)]',
        'border-t border-edge-subtle bg-surface shadow-floating',
        'pb-[env(safe-area-inset-bottom)]',
        className
      )}
      {...props}
    >
      {children}
    </Dialog.Content>
  </Dialog.Portal>
))
SheetContent.displayName = 'SheetContent'

function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-center justify-between border-b border-edge-subtle px-4 py-3',
        className
      )}
      {...props}
    />
  )
}

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof Dialog.Title>,
  React.ComponentPropsWithoutRef<typeof Dialog.Title>
>(({ className, ...props }, ref) => (
  <Dialog.Title
    ref={ref}
    className={cn('text-sm font-semibold text-ink', className)}
    {...props}
  />
))
SheetTitle.displayName = 'SheetTitle'

/** Standard close control for the sheet header (icon-only, named). */
function SheetCloseButton() {
  return (
    <Dialog.Close
      aria-label="Close menu"
      className="rounded-[var(--radius-control)] p-2 text-ink-muted transition-colors hover:bg-surface-interactive hover:text-ink"
    >
      <X className="h-4 w-4" aria-hidden="true" />
    </Dialog.Close>
  )
}

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetCloseButton }
