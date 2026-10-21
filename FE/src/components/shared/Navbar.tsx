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
  Crown,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'
import { AuthService } from '@/services/auth.api'

import { cn } from '@/utils/cn'
import { optimizeCloudinaryUrl } from '@/utils/format'
import logoSvg from '@/assets/logo2.png'

// ── Nav links ──────────────────────────────────────────────────────────────

interface NavItem {
  label: string
  href: string
}

const NAV_LINKS: NavItem[] = [
  { label: 'Về chúng tôi', href: '/about' },
  { label: 'Marketplace', href: '/marketplace' },
  { label: 'Gợi ý AI', href: '/outfit' },
  { label: 'AI Design', href: '/design?tab=ai' },
  { label: '3D Studio', href: '/design?tab=custom' },
  { label: 'Hội viên', href: '/membership' },
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

  const effectiveTier = user?.effectiveTier || (isAdmin || user?.isLifetimeMembership ? 'PRO' : user?.membershipTier || 'FREE')
  const isLifetime = Boolean(isAdmin || user?.isLifetimeMembership)

  // Fetch cart & fresh membership status on mount so badge is in sync globally
  React.useEffect(() => {
    if (isAuthenticated) {
      useCartStore.getState().fetchCart()
      AuthService.getMe()
        .then((res) => {
          const fetchedUser = (res.data.data as any)?.user || res.data.data
          if (fetchedUser) useAuthStore.getState().updateUser(fetchedUser)
        })
        .catch(() => undefined)
    }
  }, [isAuthenticated])

  return (
    <header className="fixed top-4 left-4 right-4 z-50 flex justify-center pointer-events-none">
      <nav
        className="pointer-events-auto w-full max-w-[var(--spacing-contentMax)] h-[79px] rounded-[10px] flex items-center justify-between px-8 shadow-[0_8px_30px_rgb(0,0,0,0.08)]"
        style={{ background: 'linear-gradient(180deg, #0011FF 0%, #00C8FF 100%)' }}
        aria-label="Main navigation"
      >
        {/* ── Logo ─────────────────────────────────────────────────────── */}
        <Link
          to="/"
          className="transition-opacity duration-300 hover:opacity-80 flex items-center"
          aria-label="ALTERA — Trang chủ"
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
                <Button variant="ghost" size="icon" asChild aria-label="Bảng quản trị Admin" className="text-white hover:bg-white/10 hover:text-white">
                  <Link to="/admin">
                    <LayoutDashboard className="h-[18px] w-[18px]" />
                  </Link>
                </Button>
              )}
              <Button variant="ghost" size="icon" asChild aria-label="Danh sách yêu thích" className="text-white hover:bg-white/10 hover:text-white">
                <Link to="/wishlist">
                  <Heart className="h-[18px] w-[18px]" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild aria-label="Thiết kế của tôi" title="Thiết kế của tôi" className="text-white hover:bg-white/10 hover:text-white">
                <Link to="/my-designs">
                  <Palette className="h-[18px] w-[18px]" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild aria-label="Kênh Creator" title="Kênh Creator (Doanh thu & Đơn hàng)" className="text-white hover:bg-white/10 hover:text-white">
                <Link to="/studio">
                  <Sparkles className="h-[18px] w-[18px]" />
                </Link>
              </Button>
              
              {/* Cart */}
              <Button
                variant="ghost"
                size="icon"
                asChild
                aria-label={`Giỏ hàng — ${totalItems} sản phẩm`}
                className="relative text-white hover:bg-white/10 hover:text-white"
              >
                <Link to="/cart">
                  <ShoppingBag className="h-[18px] w-[18px]" />
                  {totalItems > 0 && (
                    <span
                      className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-[#0011FF]"
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
                aria-label={`Tài khoản — ${user?.fullName || user?.email || 'Hồ sơ'}`}
                className="relative text-white hover:bg-white/10 hover:text-white ml-2"
              >
                <Link to="/profile" className="relative">
                  {(effectiveTier === 'PRO' || isLifetime) && (
                    <span className="absolute -top-2 -right-1 z-20 flex h-4 w-4 items-center justify-center rounded-full bg-[#0F172A] border border-amber-400 shadow">
                      <Crown className="h-2.5 w-2.5 text-amber-400 fill-amber-400" />
                    </span>
                  )}
                  {effectiveTier === 'PREMIUM' && !isLifetime && (
                    <span className="absolute -top-2 -right-1 z-20 flex h-4 w-4 items-center justify-center rounded-full bg-[#0F172A] border border-cyan-400 shadow">
                      <Crown className="h-2.5 w-2.5 text-cyan-400 fill-cyan-400" />
                    </span>
                  )}
                  {user?.avatar ? (
                    <img
                      src={optimizeCloudinaryUrl(user.avatar, 120)}
                      alt={user.fullName || 'Avatar'}
                      decoding="async"
                      className={cn(
                        'h-7 w-7 rounded-full object-cover',
                        effectiveTier === 'PRO' || isLifetime
                          ? 'ring-2 ring-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)]'
                          : effectiveTier === 'PREMIUM'
                          ? 'ring-2 ring-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.7)]'
                          : 'ring-1 ring-white/20'
                      )}
                    />
                  ) : (
                    <User className="h-[18px] w-[18px]" />
                  )}
                </Link>
              </Button>

              <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Đăng xuất" className="text-white hover:bg-white/10 hover:text-white">
                <LogOut className="h-[18px] w-[18px]" />
              </Button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-4">
              <Link to="/auth/login" className="text-white font-medium text-sm tracking-wide opacity-90 hover:opacity-100 transition-opacity">
                Đăng nhập
              </Link>
              <Link to="/auth/register" className="bg-white text-[#00C8FF] px-6 py-2 rounded-full font-bold text-sm tracking-wide shadow-sm hover:scale-105 transition-transform">
                Đăng ký
              </Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden ml-1"
            aria-label={mobileOpen ? 'Đóng menu' : 'Mở menu'}
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
                  <NavLink
                    to="/studio"
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
                    <Sparkles className="h-4 w-4 text-blue-600" />
                    Kênh Nhà thiết kế (Creator Hub)
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
                      {user?.fullName || user?.email || 'Hồ sơ cá nhân'}
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
                      <Link to="/auth/register" onClick={() => setMobileOpen(false)}>Đăng ký</Link>
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
