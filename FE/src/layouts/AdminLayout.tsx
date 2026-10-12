import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  CreditCard,
  Users,
  LogOut,
  ChevronLeft,
  Menu,
  Shirt,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui'

// ── Admin Sidebar Nav Links ────────────────────────────────────────────────

const ADMIN_LINKS = [
  { label: 'Tổng quan', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Sản phẩm áo', href: '/admin/products', icon: Package },
  { label: 'Đơn hàng áo', href: '/admin/orders', icon: ShoppingCart },
  { label: 'Thanh toán', href: '/admin/payments', icon: CreditCard },
  { label: 'Thanh toán thành viên', href: '/admin/membership-payments', icon: CreditCard },
  { label: 'Khách hàng', href: '/admin/customers', icon: Users },
  { label: 'Tài khoản', href: '/admin/users', icon: Users },
  { label: 'Thiết kế', href: '/admin/designs', icon: Shirt },
]

// ── Component ──────────────────────────────────────────────────────────────

/**
 * ALTERA Admin Layout
 * Used for all admin dashboard pages.
 * Includes a persistent left sidebar and a scrollable main content area.
 */
export function AdminLayout() {
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="flex min-h-screen bg-[var(--color-neutral)]">
      {/* ── Sidebar (Desktop) ──────────────────────────────────────── */}
      <aside className="hidden w-[var(--spacing-sidebar)] flex-shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-card)] md:flex">
        {/* Brand */}
        <div className="flex h-[var(--spacing-navbar)] items-center border-b border-[var(--color-border)] px-6">
          <Link
            to="/admin"
            className="font-heading text-lg font-black tracking-widest uppercase text-[var(--color-foreground)] transition-opacity hover:opacity-70"
          >
            ALTERA ADMIN
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4" aria-label="Điều hướng quản trị">
          {ADMIN_LINKS.map(({ label, href, icon: Icon }) => (
            <NavLink key={href} to={href} end={href === '/admin/dashboard'} className={({ isActive }) => `flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? 'bg-[#171717] text-white' : 'text-[var(--color-muted-foreground)] hover:bg-neutral-100 hover:text-neutral-900'}`}>
              <Icon className="mr-3 h-4 w-4" />{label}
            </NavLink>
          ))}
        </nav>

        {/* Footer actions */}
        <div className="space-y-3 border-t border-[var(--color-border)] p-4">
          <div className="px-3 pb-2 text-xs font-medium text-[var(--color-muted-foreground)]">
            Đang đăng nhập: {user?.fullName || user?.email || 'Quản trị viên'}
          </div>
          <Button variant="outline" className="w-full justify-start" asChild>
            <Link to="/">
              <ChevronLeft className="mr-3 h-4 w-4" />
              Về cửa hàng
            </Link>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-[var(--color-error)] hover:bg-red-50 hover:text-red-600"
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-4 w-4" />
            Đăng xuất
          </Button>
        </div>
      </aside>

      {/* ── Main Content Area ───────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header (visible only on small screens) */}
        <header className="flex h-[var(--spacing-navbar)] items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-card)] px-4 md:hidden">
          <Link
            to="/admin"
            className="font-heading text-base font-black tracking-widest uppercase"
          >
            ALTERA ADMIN
          </Link>
          <Button variant="ghost" size="icon" aria-label="Mở hoặc đóng điều hướng quản trị" aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen((open) => !open)}>
            <Menu className="h-5 w-5" />
          </Button>
        </header>
        {mobileMenuOpen && <nav className="border-b border-[var(--color-border)] bg-white p-3 md:hidden" aria-label="Điều hướng quản trị">{ADMIN_LINKS.map(({ label, href, icon: Icon }) => <NavLink key={href} to={href} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `flex items-center rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-[#171717] text-white' : 'text-neutral-700'}`}><Icon className="mr-3 h-4 w-4"/>{label}</NavLink>)}<p className="px-3 pt-3 text-xs text-neutral-500">Đang đăng nhập: {user?.fullName || user?.email || 'Quản trị viên'}</p></nav>}

        <header className="hidden items-center justify-between border-b border-neutral-200 bg-white px-8 py-3 md:flex">
          <div><p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">QUẢN TRỊ ALTERA</p><p className="text-sm font-semibold">{user?.fullName || user?.email || 'Quản trị viên'}</p></div>
          <Button variant="ghost" className="text-neutral-600" onClick={handleLogout}><LogOut className="mr-2 h-4 w-4"/>Đăng xuất</Button>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto bg-[#f6f6f6] p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
