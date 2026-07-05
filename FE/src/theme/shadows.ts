/**
 * ALTERA Design System — Shadow Tokens
 * Fashion-grade: subtle, diffused, not heavy.
 */

export const shadows = {
  none: 'none',
  sm: '0 2px 8px 0 rgb(0 0 0 / 0.02)',
  md: '0 8px 16px -4px rgb(0 0 0 / 0.04), 0 4px 8px -4px rgb(0 0 0 / 0.02)',
  lg: '0 12px 24px -8px rgb(0 0 0 / 0.05), 0 8px 16px -8px rgb(0 0 0 / 0.03)',
  xl: '0 24px 48px -12px rgb(0 0 0 / 0.08), 0 16px 24px -12px rgb(0 0 0 / 0.04)',
  '2xl': '0 32px 64px -16px rgb(0 0 0 / 0.1)',

  // Hover lift effect (use on cards)
  hover: '0 16px 32px -8px rgb(0 0 0 / 0.08)',

  // Inner shadow for inputs
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.02)',
} as const

export type ShadowKey = keyof typeof shadows
