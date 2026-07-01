import { Link } from 'react-router-dom'
import { Camera, MessageCircle, Video, ArrowUpRight } from 'lucide-react'
import { cn } from '@/utils/cn'

// ── Data ───────────────────────────────────────────────────────────────────

const FOOTER_LINKS = [
  {
    heading: 'Shop',
    links: [
      { label: 'New Arrivals', href: '/products?sort=newest' },
      { label: 'T-Shirts', href: '/products?category=T-SHIRT' },
      { label: 'Jackets', href: '/products?category=JACKET' },
      { label: 'Wishlist', href: '/wishlist' },
    ],
  },
  {
    heading: 'Studio',
    links: [
      { label: 'Design Studio', href: '/design' },
      { label: 'My Designs', href: '/designs' },
      { label: 'AI Stylist', href: '/outfit' },
    ],
  },
  {
    heading: 'Support',
    links: [
      { label: 'Membership', href: '/membership' },
      { label: 'About Us', href: '/about' },
      { label: 'Contact', href: '/contact' },
    ],
  },
]

const SOCIAL_LINKS = [
  { label: 'Instagram', href: 'https://instagram.com', icon: Camera },
  { label: 'Twitter / X', href: 'https://twitter.com', icon: MessageCircle },
  { label: 'YouTube', href: 'https://youtube.com', icon: Video },
]

// ── Component ──────────────────────────────────────────────────────────────

interface FooterProps {
  className?: string
}

/**
 * ALTERA Footer — rendered on all public pages via MainLayout.
 */
export function Footer({ className }: FooterProps) {
  const currentYear = new Date().getFullYear()

  return (
    <footer
      className={cn(
        'border-t border-[var(--color-border)] bg-[var(--color-background)]',
        className,
      )}
      aria-label="Site footer"
    >
      <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6">
        {/* ── Top section ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-10 py-16 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link
              to="/"
              className="font-heading text-2xl font-black tracking-widest uppercase"
              aria-label="ALTERA — Home"
            >
              ALTERA
            </Link>
            <p className="mt-4 max-w-xs text-sm text-[var(--color-muted-foreground)] leading-relaxed">
              AI-powered fashion for the next generation. Design, discover, and
              express yourself with technology that understands your style.
            </p>

            {/* Social */}
            <div className="mt-6 flex items-center gap-3">
              {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full',
                    'border border-[var(--color-border)]',
                    'text-[var(--color-muted-foreground)]',
                    'transition-colors duration-150',
                    'hover:border-[var(--color-foreground)] hover:text-[var(--color-foreground)]',
                  )}
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          {FOOTER_LINKS.map((col) => (
            <div key={col.heading}>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[var(--color-foreground)]">
                {col.heading}
              </h3>
              <ul className="space-y-3" role="list">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-sm text-[var(--color-muted-foreground)] transition-colors duration-150 hover:text-[var(--color-foreground)] inline-flex items-center gap-1 group"
                    >
                      {link.label}
                      <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Bottom section ──────────────────────────────────────────── */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-[var(--color-border)] py-6 sm:flex-row">
          <p className="text-xs text-[var(--color-muted-foreground)]">
            © {currentYear} ALTERA. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link
              to="/privacy"
              className="text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className="text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
