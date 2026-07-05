/**
 * ALTERA Design System — Color Tokens
 * Single source of truth for all brand colors.
 * Always use these constants; never hardcode hex values in components.
 */

export const colors = {
  // Brand
  primary: '#111111',
  primaryForeground: '#ffffff',

  secondary: '#ffffff',
  secondaryForeground: '#111111',

  accent: '#737373', // Subdued accent for a more sophisticated look
  accentForeground: '#ffffff',

  neutral: '#f4f4f5',
  neutralForeground: '#111111',

  // Semantic
  background: '#fafafa', // Off-white for luxury feel
  foreground: '#111111', // Deep primary text

  muted: '#f4f4f5',
  mutedForeground: '#71717a',

  border: '#e4e4e7',
  input: '#e4e4e7',
  ring: '#111111',

  card: '#ffffff',
  cardForeground: '#111111',

  // Status
  success: '#10b981',
  successForeground: '#ffffff',

  warning: '#f59e0b',
  warningForeground: '#ffffff',

  error: '#ef4444',
  errorForeground: '#ffffff',

  destructive: '#ef4444',
  destructiveForeground: '#ffffff',
} as const

export type ColorKey = keyof typeof colors
