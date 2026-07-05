/**
 * ALTERA Design System — Spacing Tokens
 */

export const spacing = {
  px: '1px',
  0: '0px',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  2: '0.5rem',      // 8px
  3: '0.75rem',     // 12px
  4: '1.25rem',     // 20px (increased from 16px for more breathing room)
  5: '1.5rem',      // 24px (increased from 20px)
  6: '2rem',        // 32px (increased from 24px)
  8: '2.5rem',      // 40px (increased from 32px)
  10: '3rem',       // 48px (increased from 40px)
  12: '4rem',       // 64px (increased from 48px)
  16: '5rem',       // 80px (increased from 64px)
  20: '6rem',       // 96px (increased from 80px)
  24: '8rem',       // 128px (increased from 96px)
  32: '10rem',      // 160px (increased from 128px)
  40: '12rem',      // 192px (increased from 160px)
  48: '16rem',      // 256px (increased from 192px)
  64: '20rem',      // 320px (increased from 256px)

  // Layout-specific
  navbar: '80px',
  sidebar: '260px',
  containerMax: '1600px',
  contentMax: '1440px',
} as const

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const
