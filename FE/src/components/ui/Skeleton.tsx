import { forwardRef } from 'react'
import { cn } from '@/utils/cn'

// ── Skeleton ───────────────────────────────────────────────────────────────

/**
 * Skeleton loading placeholder.
 * Use to show the shape of content while data is loading.
 *
 * @example
 * <Skeleton className="h-4 w-[200px]" />
 * <Skeleton className="h-48 w-full rounded-lg" />
 */
export const Skeleton = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      role="status"
      aria-label="Loading…"
      className={cn(
        'relative overflow-hidden rounded-[var(--radius-md)]',
        'bg-[var(--color-neutral)]',
        'before:absolute before:inset-0 before:-translate-x-full',
        'before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent',
        className,
      )}
      {...props}
    />
  ),
)
Skeleton.displayName = 'Skeleton'

// ── Spinner ────────────────────────────────────────────────────────────────

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  label?: string
}

const spinnerSizes = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-[3px]',
}

/**
 * Spinning loading indicator.
 *
 * @example
 * <Spinner />
 * <Spinner size="lg" label="Processing payment…" />
 */
export function Spinner({ size = 'md', className, label = 'Loading…' }: SpinnerProps) {
  return (
    <div role="status" aria-label={label} className={cn('inline-flex items-center justify-center', className)}>
      <div
        className={cn(
          'animate-spin rounded-full',
          'border-[var(--color-border)] border-t-[var(--color-foreground)]',
          spinnerSizes[size],
        )}
      />
      <span className="sr-only">{label}</span>
    </div>
  )
}
