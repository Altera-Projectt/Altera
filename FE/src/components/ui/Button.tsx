import { forwardRef } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils/cn'

// ── Variant definitions ────────────────────────────────────────────────────

const buttonVariants = cva(
  // Base styles — all buttons
  [
    'inline-flex items-center justify-center gap-2',
    'font-medium font-body text-sm leading-none',
    'select-none whitespace-nowrap',
    'rounded-[var(--radius-md)]',
    'transition-all duration-200 ease-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]',
    'disabled:pointer-events-none disabled:opacity-35',
    'active:scale-[0.97]',
  ],
  {
    variants: {
      variant: {
        // ── Primary — White bg, #111111 text. High contrast CTA.
        primary: [
          'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]',
          'font-semibold tracking-wide',
          'hover:bg-white/90 hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:-translate-y-px',
        ],

        // ── Secondary — Zinc-800 bg, subtle surface action
        secondary: [
          'bg-[var(--color-neutral)] text-[var(--color-neutral-foreground)]',
          'border border-[var(--color-border)]',
          'hover:bg-zinc-700 hover:border-zinc-600 hover:-translate-y-px',
        ],

        // ── Outline — transparent, border-only. Inverts on hover.
        outline: [
          'border border-[var(--color-border)] bg-transparent text-[var(--color-foreground)]',
          'hover:bg-[var(--color-foreground)] hover:text-[var(--color-background)] hover:border-transparent',
          'hover:-translate-y-px',
        ],

        // ── Ghost — no background, text-only. Ultra-subtle.
        ghost: [
          'bg-transparent text-[var(--color-muted-foreground)]',
          'hover:bg-white/[0.06] hover:text-[var(--color-foreground)]',
        ],

        // ── Danger — red destructive action
        danger: [
          'bg-[var(--color-error)] text-[var(--color-error-foreground)]',
          'hover:bg-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.25)] hover:-translate-y-px',
        ],

        // ── Accent — Rose-red brand accent
        accent: [
          'bg-[var(--color-accent)] text-[var(--color-accent-foreground)]',
          'font-semibold',
          'hover:bg-rose-500 hover:shadow-[0_0_24px_rgba(225,29,72,0.4)] hover:-translate-y-px',
        ],

        // ── Link — inline text link, no chrome
        link: [
          'bg-transparent text-[var(--color-foreground)] underline-offset-4',
          'hover:underline hover:opacity-80',
          'h-auto p-0',
        ],
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-5 text-xs uppercase tracking-widest font-semibold',
        lg: 'h-12 px-8 text-xs uppercase tracking-widest font-bold',
        xl: 'h-14 px-10 text-sm uppercase tracking-widest font-bold',
        icon: 'h-10 w-10 p-0',
        'icon-sm': 'h-8 w-8 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

// ── Props ──────────────────────────────────────────────────────────────────

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  /** Render as child component (Radix Slot pattern) */
  asChild?: boolean
  /** Show loading spinner and disable interaction */
  loading?: boolean
}

// ── Component ──────────────────────────────────────────────────────────────

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled ?? loading}
        aria-disabled={disabled ?? loading}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span className="ml-1">Loading…</span>
          </>
        ) : (
          children
        )}
      </Comp>
    )
  },
)

Button.displayName = 'Button'
