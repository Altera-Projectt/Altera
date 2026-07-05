/**
 * ALTERA Design System — Border Radius Tokens
 */

export const radius = {
  none: '0px',
  sm: '1px',
  md: '2px',
  lg: '4px',
  xl: '8px',
  '2xl': '12px',
  full: '9999px',
} as const

export type RadiusKey = keyof typeof radius
