import React, { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingBag,
  Menu,
  X,
  User,
  Heart,
  Sparkles,
  LogOut,
  LayoutDashboard,
  Palette,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { useCartStore } from '@/store/cartStore'

import { cn } from '@/utils/cn'
import logoSvg from '@/assets/logo2.png'

// ── Nav links ──────────────────────────────────────────────────────────────

interface NavItem {
  label: string
  href: string
}

const NAV_LINKS: NavItem[] = [
  { label: 'About us', href: '/about' },
  { label: 'Design Market', href: '/marketplace' },
  { label: 'AI Suggest', href: '/outfit' },
  { label: 'AI Design', href: '/design' },
  { label: 'Studio', href: '/studio' },
  { label: 'Membership', href: '/membership' },
]

// ── Component ──────────────────────────────────────────────────────────────

/**
 * ALTERA Navbar — used in MainLayout for all public pages.
 * Features: logo, nav links, search, cart, auth buttons, mobile menu.
 */
export function Navbar() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth()
  const totalItems = useCartStore((s) => s.totalItems())
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  // Fetch cart data on mount so badge is in sync globally
  React.useEffect(() => {
    if (isAuthenticated) {
      useCartStore.getState().fetchCart()
    }
  }, [isAuthenticated])

  return (
    <header className="fixed top-4 left-4 right-4 z-50 flex justify-center pointer-events-none">
      <nav
        className="pointer-events-auto w-full max-w-[var(--spacing-contentMax)] h-[79px] rounded-[10px] flex items-center justify-between px-8 bg-neutral-950/90 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white/10"
        aria-label="Main navigation"
      >
        {/* ── Logo ─────────────────────────────────────────────────────── */}
        <Link
          to="/"
          className="transition-opacity duration-300 hover:opacity-80 flex items-center"
          aria-label="ALTERA — Home"
        >
          <img src={logoSvg} alt="ALTERA Logo" className="h-8 md:h-10 w-auto object-contain" />
        </Link>

        {/* ── Desktop Nav Links ─────────────────────────────────────────── */}
        <ul className="hidden md:flex items-center justify-center flex-1 gap-12" role="list">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <NavLink
                to={link.href}
                className={({ isActive }) =>
                  cn(
                    'relative text-sm font-medium tracking-wide transition-opacity duration-200 text-white',
                    isActive ? 'opacity-100 font-bold' : 'opacity-80 hover:opacity-100'
                  )
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* ── Right Actions ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 md:gap-4">
          
          {/* Authenticated desktop actions */}
          {isAuthenticated ? (
            <div className="hidden md:flex items-center gap-1">
              {isAdmin && (
                <Button variant="ghost" size="icon" asChild aria-label="Admin dashboard" className="text-white hover:bg-white/10 hover:text-white">
                  <Link to="/admin">
                    <LayoutDashboard className="h-[18px] w-[18px]" />
                  </Link>
                </Button>
              )}
              <Button variant="ghost" size="icon" asChild aria-label="Wishlist" className="text-white hover:bg-white/10 hover:text-white">
                <Link to="/wishlist">
                  <Heart className="h-[18px] w-[18px]" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild aria-label="My Designs" className="text-white hover:bg-white/10 hover:text-white">
                <Link to="/my-designs">
                  <Palette className="h-[18px] w-[18px]" />
                </Link>
              </Button>
              
              {/* Cart */}
              <Button
                variant="ghost"
                size="icon"
                asChild
                aria-label={`Cart — ${totalItems} items`}
                className="relative text-white hover:bg-white/10 hover:text-white"
              >
                <Link to="/cart">
                  <ShoppingBag className="h-[18px] w-[18px]" />
                  {totalItems > 0 && (
                    <span
                      className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-black"
                      aria-hidden="true"
                    >
                      {totalItems > 99 ? '99+' : totalItems}
                    </span>
                  )}
                </Link>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                asChild
                aria-label={`Profile — ${user?.fullName || user?.email || 'Profile'}`}
                className="text-white hover:bg-white/10 hover:text-white ml-2"
              >
                <Link to="/profile">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.fullName || 'Avatar'}
                      className="h-7 w-7 rounded-full object-cover ring-1 ring-white/20"
                    />
                  ) : (
                    <User className="h-[18px] w-[18px]" />
                  )}
                </Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Log out" className="text-white hover:bg-white/10 hover:text-white">
                <LogOut className="h-[18px] w-[18px]" />
              </Button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-4">
              <Link to="/auth/login" className="text-white font-medium text-sm tracking-wide opacity-90 hover:opacity-100 transition-opacity">
                Sign in
              </Link>
              <Link to="/auth/register" className="bg-white text-black px-6 py-2 rounded-full font-bold text-sm tracking-wide shadow-sm hover:scale-105 transition-transform">
                Sign up
              </Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden ml-1"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5 text-white" /> : <Menu className="h-5 w-5 text-white" />}
          </Button>
        </div>
      </nav>

      {/* ── Mobile Menu ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="md:hidden border-t border-black/[0.05] bg-white/90 backdrop-blur-xl overflow-hidden"
          >
            <div className="max-w-[var(--spacing-contentMax)] mx-auto px-6 py-5 flex flex-col gap-4">
              {/* Nav links */}
              <ul className="flex flex-col gap-1" role="list">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <NavLink
                      to={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center h-10 px-3 rounded-[var(--radius-md)] text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-black/[0.08] text-[var(--color-foreground)]'
                            : 'text-[var(--color-muted-foreground)] hover:bg-black/[0.05] hover:text-[var(--color-foreground)]',
                        )
                      }
                    >
                      {link.label}
                    </NavLink>
                  </li>
                ))}
              </ul>

              {/* AI Stylist CTA */}
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20">
                <Sparkles className="h-4 w-4 text-[var(--color-accent)] shrink-0" />
                <Link
                  to="/outfit"
                  className="text-sm font-medium text-[var(--color-accent)]"
                  onClick={() => setMobileOpen(false)}
                >
                  Trải nghiệm AI Stylist
                </Link>
              </div>

              {/* Authenticated quick links */}
              {isAuthenticated && (
                <div className="flex flex-col gap-1">
                  <NavLink
                    to="/wishlist"
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2 h-10 px-3 rounded-[var(--radius-md)] text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-black/[0.08] text-[var(--color-foreground)]'
                          : 'text-[var(--color-muted-foreground)] hover:bg-black/[0.05] hover:text-[var(--color-foreground)]',
                      )
                    }
                  >
                    <Heart className="h-4 w-4" />
                    Yêu thích
                  </NavLink>
                  <NavLink
                    to="/my-designs"
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2 h-10 px-3 rounded-[var(--radius-md)] text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-black/[0.08] text-[var(--color-foreground)]'
                          : 'text-[var(--color-muted-foreground)] hover:bg-black/[0.05] hover:text-[var(--color-foreground)]',
                      )
                    }
                  >
                    <Palette className="h-4 w-4" />
                    Bộ sưu tập thiết kế
                  </NavLink>
                </div>
              )}

              {/* Auth buttons */}
              <div className="flex flex-col gap-2 pt-2 border-t border-black/[0.05]">
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/profile"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 h-10 px-3 text-sm font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
                    >
                      <User className="h-4 w-4" />
                      {user?.fullName || user?.email || 'Profile'}
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => { handleLogout(); setMobileOpen(false) }}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Đăng xuất
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="md" asChild className="w-full">
                      <Link to="/auth/login" onClick={() => setMobileOpen(false)}>Đăng nhập</Link>
                    </Button>
                    <Button variant="primary" size="md" asChild className="w-full">
                      <Link to="/auth/register" onClick={() => setMobileOpen(false)}>Bắt đầu</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
