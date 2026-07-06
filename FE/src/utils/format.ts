/**
 * ALTERA — Format Utilities
 * Pure, side-effect-free formatting helpers.
 */

// ── Currency ───────────────────────────────────────────────────────────────

/**
 * Format a number as VND currency.
 * @example formatPrice(150000) → "150.000 ₫"
 */
export function formatPrice(amount: number, currency = 'VND'): string {
  if (currency === 'VND') {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(amount)
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

/**
 * Alias of formatPrice for VND — for consistency across the project.
 * @example formatVND(299000) → "299.000 ₫"
 */
export const formatVND = (amount: number | string | undefined | null): string => {
  const num = Number(amount)
  if (isNaN(num)) return '0 ₫'
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
}

/**
 * Short format for large VND amounts.
 * @example formatVNDShort(299000) → "299k ₫"
 * @example formatVNDShort(1200000) → "1.2tr ₫"
 */
export const formatVNDShort = (amount: number): string => {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(amount % 1_000_000 === 0 ? 0 : 1)}tr ₫`
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(0)}k ₫`
  }
  return formatVND(amount)
}

/**
 * Format a discount percentage.
 * @example formatDiscount(20) → "-20%"
 */
export function formatDiscount(percent: number): string {
  return `-${percent}%`
}

// ── Date ───────────────────────────────────────────────────────────────────

/**
 * Format an ISO date string to a readable date.
 * @example formatDate("2026-06-24") → "24 Jun 2026"
 */
export function formatDate(dateStr: string | Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr))
}

/**
 * Format a date to relative time (e.g., "2 hours ago").
 */
export function formatRelativeTime(dateStr: string | Date): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return formatDate(dateStr)
}

// ── String ─────────────────────────────────────────────────────────────────

/**
 * Truncate a string to a max length with ellipsis.
 * @example truncate("Long product name here", 20) → "Long product name..."
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 3) + '...'
}

/**
 * Capitalize the first letter of each word.
 * @example titleCase("blue denim jacket") → "Blue Denim Jacket"
 */
export function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Get user initials for avatars.
 * @example getInitials("Nguyen Van A") → "NA"
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (
    parts[0].charAt(0).toUpperCase() +
    parts[parts.length - 1].charAt(0).toUpperCase()
  )
}

// ── Number ─────────────────────────────────────────────────────────────────

/**
 * Format a number with compact notation.
 * @example formatCompact(1500) → "1.5K"
 */
export function formatCompact(num: number): string {
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(num)
}
