import { cn } from '@/lib/utils'

// ============================================================
// ForgeFitOS brand mark (Phase 4B.1)
// One restrained geometric monogram: an "F" built from three
// modular bars on a grid — the forge/OS "module" concept — as an
// original inline SVG. Uses semantic tokens/currentColor, legible
// at 24px, no raster asset, no emoji, no stock fitness symbol.
// Decorative instances are aria-hidden; the wordmark carries the
// accessible name.
// ============================================================

export function BrandMark({
  className,
  decorative = true,
}: {
  className?: string
  decorative?: boolean
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn('size-6', className)}
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative ? 'true' : undefined}
      aria-label={decorative ? undefined : 'ForgeFitOS'}
      fill="none"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" fill="hsl(var(--brand))" />
      {/* Modular F: three bars on the grid */}
      <rect x="8" y="7" width="9" height="2.6" rx="1.3" fill="hsl(var(--brand-foreground))" />
      <rect x="8" y="11.2" width="6.5" height="2.6" rx="1.3" fill="hsl(var(--brand-foreground))" />
      <rect x="8" y="11.2" width="2.6" height="6" rx="1.3" fill="hsl(var(--brand-foreground))" />
    </svg>
  )
}

/**
 * Wordmark lockup (UI-1B): mark + the visible FORGEFIT wordmark —
 * "FORGE" in ink, "FIT" in brand mint (the approved shell
 * presentation). The ACCESSIBLE name remains "ForgeFitOS": the
 * wordmark text is decorative (aria-hidden) and the lockup carries
 * aria-label="ForgeFitOS", so screen readers, metadata, and the
 * formal product name stay unchanged. `size="compact"` is the
 * accessible small variation for tight headers.
 */
export function BrandWordmark({
  className,
  size = 'default',
}: {
  className?: string
  size?: 'default' | 'compact'
}) {
  const compact = size === 'compact'
  return (
    <span
      className={cn('inline-flex items-center', compact ? 'gap-1.5' : 'gap-2', className)}
      aria-label="ForgeFitOS"
    >
      <BrandMark className={compact ? 'size-5' : 'size-6'} />
      <span
        className={cn(
          'font-semibold uppercase leading-none',
          compact ? 'text-xs tracking-[0.14em]' : 'text-sm tracking-[0.18em]'
        )}
        aria-hidden="true"
      >
        <span className="text-ink">FORGE</span>
        <span className="text-brand">FIT</span>
      </span>
    </span>
  )
}
