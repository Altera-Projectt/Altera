import React, { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingBag,
  Search,
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
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/hooks/useAuth'
import { useCartStore } from '@/store/cartStore'
import { useUIStore } from '@/store/uiStore'
import { cn } from '@/utils/cn'

// ── Nav links ──────────────────────────────────────────────────────────────

interface NavItem {
  label: string
  href: string
}

const NAV_LINKS: NavItem[] = [
  { label: 'Bộ sưu tập', href: '/products' },
  { label: 'Trợ lý Phong cách', href: '/outfit' },
  { label: 'Phòng thiết kế', href: '/design' },
  { label: 'Thành viên', href: '/membership' },
  { label: 'Về ALTERA', href: '/about' },
]

// ── Component ──────────────────────────────────────────────────────────────

/**
 * ALTERA Navbar — used in MainLayout for all public pages.
 * Features: logo, nav links, search, cart, auth buttons, mobile menu.
 */
export function Navbar() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth()
  const totalItems = useCartStore((s) => s.totalItems())
  const { setSearchOpen } = useUIStore()
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
    <header className="fixed top-0 left-0 right-0 z-40 bg-[var(--color-background)]/90 backdrop-blur-md border-b border-[var(--color-border)]">
      <nav
        className="mx-auto flex h-[var(--spacing-navbar)] max-w-[var(--spacing-contentMax)] items-center justify-between px-6"
        aria-label="Main navigation"
      >
        {/* ── Logo ─────────────────────────────────────────────────────── */}
        <Link
          to="/"
          className="font-heading text-xl font-black tracking-widest uppercase transition-opacity hover:opacity-70"
          aria-label="ALTERA — Home"
        >
          ALTERA
        </Link>

        {/* ── Desktop Nav Links ─────────────────────────────────────────── */}
        <ul className="hidden md:flex items-center gap-8" role="list">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <NavLink
                to={link.href}
                className={({ isActive }) =>
                  cn(
                    'text-sm font-medium tracking-wide transition-colors duration-150',
                    isActive
                      ? 'text-[var(--color-foreground)]'
                      : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]',
                  )
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* ── Right Actions ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-1">
          {/* Search */}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open search"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* Cart */}
          {isAuthenticated && (
            <Button
              variant="ghost"
              size="icon"
              asChild
              aria-label={`Cart — ${totalItems} items`}
              className="relative"
            >
              <Link to="/cart">
                <ShoppingBag className="h-4 w-4" />
                {totalItems > 0 && (
                  <Badge
                    variant="accent"
                    className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center"
                    aria-hidden="true"
                  >
                    {totalItems > 99 ? '99+' : totalItems}
                  </Badge>
                )}
              </Link>
            </Button>
          )}

          {/* Auth */}
          {isAuthenticated ? (
            <div className="hidden md:flex items-center gap-1 ml-2">
              {isAdmin && (
                <Button variant="ghost" size="icon" asChild aria-label="Admin dashboard">
                  <Link to="/admin">
                    <LayoutDashboard className="h-4 w-4" />
                  </Link>
                </Button>
              )}
              <Button variant="ghost" size="icon" asChild aria-label="Wishlist">
                <Link to="/wishlist">
                  <Heart className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild aria-label="My Designs">
                <Link to="/designs">
                  <Palette className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild aria-label={`Profile — ${user?.fullName || user?.email || 'Profile'}`}>
                <Link to="/profile">
                  <User className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Log out">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2 ml-3">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth/login">Đăng nhập</Link>
              </Button>
              <Button variant="primary" size="sm" asChild>
                <Link to="/auth/register">Bắt đầu</Link>
              </Button>
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
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </nav>

      {/* ── Mobile Menu ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="md:hidden border-t border-[var(--color-border)] bg-[var(--color-background)] overflow-hidden"
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
                            ? 'bg-[var(--color-neutral)] text-[var(--color-foreground)]'
                            : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-neutral)] hover:text-[var(--color-foreground)]',
                        )
                      }
                    >
                      {link.label}
                    </NavLink>
                  </li>
                ))}
              </ul>

              {/* AI Stylist CTA */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] bg-[var(--color-neutral)]">
                <Sparkles className="h-4 w-4 text-[var(--color-accent)]" />
                <Link
                  to="/outfit"
                  className="text-sm font-medium"
                  onClick={() => setMobileOpen(false)}
                >
                  Trải nghiệm AI Stylist
                </Link>
              </div>

              {/* New pages quick links */}
              {isAuthenticated && (
                <div className="flex flex-col gap-1">
                  <NavLink
                    to="/wishlist"
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2 h-10 px-3 rounded-[var(--radius-md)] text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-[var(--color-neutral)] text-[var(--color-foreground)]'
                          : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-neutral)] hover:text-[var(--color-foreground)]',
                      )
                    }
                  >
                    <Heart className="h-4 w-4" />
                    Yêu thích
                  </NavLink>
                  <NavLink
                    to="/designs"
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2 h-10 px-3 rounded-[var(--radius-md)] text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-[var(--color-neutral)] text-[var(--color-foreground)]'
                          : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-neutral)] hover:text-[var(--color-foreground)]',
                      )
                    }
                  >
                    <Palette className="h-4 w-4" />
                    Bộ sưu tập thiết kế
                  </NavLink>
                </div>
              )}

              {/* Auth buttons */}
              <div className="flex flex-col gap-2 pt-2 border-t border-[var(--color-border)]">
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/profile"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 h-10 px-3 text-sm font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
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
