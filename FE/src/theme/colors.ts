/**
 * ALTERA Design System — Color Tokens
 * Single source of truth for all brand colors.
 * Always use these constants; never hardcode hex values in components.
 */

export const colors = {
  // Brand
  primary: '#ffffff',
  primaryForeground: '#111111',

  secondary: '#27272a',
  secondaryForeground: '#e5e5e5',

  accent: '#e11d48', // Keeping accent as is
  accentForeground: '#ffffff',

  neutral: '#27272a',
  neutralForeground: '#e5e5e5',

  // Semantic
  background: '#111111', 
  foreground: '#e5e5e5', 

  muted: '#1a1a1a',
  mutedForeground: '#a1a1aa',

  border: '#27272a',
  input: '#27272a',
  ring: '#52525b',

  card: '#18181b',
  cardForeground: '#e5e5e5',

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
