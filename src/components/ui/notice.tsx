import * as React from 'react'
import { Info, CircleCheck, TriangleAlert, CircleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================
// ForgeFitOS Notice (Phase 4B.1)
// Inline callout for contextual information and state. Semantic
// color plus a professional line icon plus TEXT — color never
// carries the meaning alone, and no emoji is ever used. Critical
// and caution notices announce via role="alert"/"status".
// ============================================================

type NoticeVariant = 'neutral' | 'info' | 'success' | 'caution' | 'critical'

const VARIANT_STYLES: Record<NoticeVariant, string> = {
  neutral:
    'bg-[hsl(var(--surface-raised))] text-[hsl(var(--text-secondary))] ring-[hsl(var(--border-subtle))]',
  info: 'bg-[hsl(var(--info-subtle))] text-[hsl(var(--info))] ring-[hsl(var(--info)/0.25)]',
  success:
    'bg-[hsl(var(--success-subtle))] text-[hsl(var(--success))] ring-[hsl(var(--success)/0.25)]',
  caution:
    'bg-[hsl(var(--caution-subtle))] text-[hsl(var(--caution))] ring-[hsl(var(--caution)/0.25)]',
  critical:
    'bg-[hsl(var(--critical-subtle))] text-[hsl(var(--critical))] ring-[hsl(var(--critical)/0.25)]',
}

const VARIANT_ICONS: Record<NoticeVariant, React.ComponentType<{ className?: string }> | null> = {
  neutral: null,
  info: Info,
  success: CircleCheck,
  caution: TriangleAlert,
  critical: CircleAlert,
}

export function Notice({
  variant = 'neutral',
  title,
  action,
  icon = true,
  className,
  children,
}: {
  variant?: NoticeVariant
  title?: string
  /** Optional inline action (a link or small button). */
  action?: React.ReactNode
  /** Set false to omit the semantic icon. */
  icon?: boolean
  className?: string
  children?: React.ReactNode
}) {
  const IconComponent = icon ? VARIANT_ICONS[variant] : null
  const role = variant === 'critical' ? 'alert' : variant === 'caution' ? 'status' : undefined

  return (
    <div
      role={role}
      data-slot="notice"
      data-variant={variant}
      className={cn(
        'flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-sm ring-1',
        VARIANT_STYLES[variant],
        className
      )}
    >
      {IconComponent && (
        <IconComponent className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      )}
      <div className="min-w-0 flex-1 space-y-0.5">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className="text-xs leading-relaxed">{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
