import { Skeleton } from './Skeleton'
import { cn } from '@/utils/cn'

// ── Props ──────────────────────────────────────────────────────────────────

interface LoadingStateProps {
  /** Full-page centered layout vs. inline */
  fullPage?: boolean
  /** Number of skeleton rows to show */
  rows?: number
  className?: string
}

// ── Skeletons ──────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="aspect-[3/4] w-full rounded-[var(--radius-lg)]" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-1/4" />
    </div>
  )
}

function RowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4">
      <Skeleton className="h-12 w-12 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-8 w-20" />
    </div>
  )
}

// ── Component ──────────────────────────────────────────────────────────────

/**
 * Standard ALTERA loading state component.
 * Use whenever a component fetches data and is in a loading state.
 *
 * @example
 * // Inline loading (product grid)
 * if (isLoading) return <LoadingState rows={6} />
 *
 * // Full page
 * if (isLoading) return <LoadingState fullPage />
 */
export function LoadingState({ fullPage = false, rows = 3, className }: LoadingStateProps) {
  if (fullPage) {
    return (
      <div
        className={cn(
          'flex min-h-[60vh] flex-col items-center justify-center gap-6',
          className,
        )}
        aria-live="polite"
        aria-busy="true"
      >
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-foreground)]" />
        <p className="text-sm text-[var(--color-muted-foreground)] animate-pulse">
          Loading…
        </p>
      </div>
    )
  }

  return (
    <div
      className={cn('space-y-4', className)}
      aria-live="polite"
      aria-busy="true"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <RowSkeleton key={i} />
      ))}
    </div>
  )
}

// ── Grid variant ───────────────────────────────────────────────────────────

interface GridLoadingProps {
  cols?: number
  className?: string
}

/**
 * Grid loading state for product grids.
 *
 * @example
 * if (isLoading) return <GridLoadingState cols={4} />
 */
export function GridLoadingState({ cols = 4, className }: GridLoadingProps) {
  return (
    <div
      className={cn(
        'grid gap-6',
        cols === 2 && 'grid-cols-1 sm:grid-cols-2',
        cols === 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        cols === 4 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        className,
      )}
      aria-live="polite"
      aria-busy="true"
    >
      {Array.from({ length: cols * 2 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}
