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
    'transition-all duration-300 ease-smooth',
    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-1',
    'disabled:pointer-events-none disabled:opacity-40',
    'active:scale-[0.98]',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]',
          'hover:bg-zinc-800 hover:shadow-md hover:-translate-y-0.5',
        ],
        secondary: [
          'bg-[var(--color-neutral)] text-[var(--color-neutral-foreground)]',
          'hover:bg-zinc-200 hover:-translate-y-0.5',
        ],
        outline: [
          'border border-[var(--color-border)] bg-transparent text-[var(--color-foreground)]',
          'hover:bg-[var(--color-foreground)] hover:text-[var(--color-background)]',
        ],
        ghost: [
          'bg-transparent text-[var(--color-foreground)]',
          'hover:bg-[var(--color-neutral)]',
        ],
        danger: [
          'bg-[var(--color-error)] text-[var(--color-error-foreground)]',
          'hover:bg-red-600 hover:shadow-md hover:-translate-y-0.5',
        ],
        accent: [
          'bg-[var(--color-accent)] text-[var(--color-accent-foreground)]',
          'hover:opacity-90 hover:shadow-md hover:-translate-y-0.5',
        ],
        link: [
          'bg-transparent text-[var(--color-foreground)] underline-offset-4',
          'hover:underline p-0 h-auto hover:opacity-80',
        ],
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-5 text-sm uppercase tracking-wide font-semibold',
        lg: 'h-12 px-8 text-sm uppercase tracking-wide font-bold',
        xl: 'h-14 px-10 text-base uppercase tracking-wider font-bold',
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
