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
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Products', href: '/admin/products', icon: Package },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { label: 'Payments', href: '/admin/payments', icon: CreditCard },
  { label: 'Membership Payments', href: '/admin/membership-payments', icon: CreditCard },
  { label: 'Customers', href: '/admin/customers', icon: Users },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Designs', href: '/admin/designs', icon: Shirt },
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
        <nav className="flex-1 space-y-1 p-4" aria-label="Admin sidebar">
          {ADMIN_LINKS.map(({ label, href, icon: Icon }) => (
            <NavLink key={href} to={href} end={href === '/admin/dashboard'} className={({ isActive }) => `flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? 'bg-[#171717] text-white' : 'text-[var(--color-muted-foreground)] hover:bg-neutral-100 hover:text-neutral-900'}`}>
              <Icon className="mr-3 h-4 w-4" />{label}
            </NavLink>
          ))}
        </nav>

        {/* Footer actions */}
        <div className="space-y-3 border-t border-[var(--color-border)] p-4">
          <div className="px-3 pb-2 text-xs font-medium text-[var(--color-muted-foreground)]">
            Logged in as {user?.fullName || user?.email || 'Admin'}
          </div>
          <Button variant="outline" className="w-full justify-start" asChild>
            <Link to="/">
              <ChevronLeft className="mr-3 h-4 w-4" />
              Back to Store
            </Link>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-[var(--color-error)] hover:bg-red-50 hover:text-red-600"
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-4 w-4" />
            Sign out
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
          <Button variant="ghost" size="icon" aria-label="Toggle admin navigation" aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen((open) => !open)}>
            <Menu className="h-5 w-5" />
          </Button>
        </header>
        {mobileMenuOpen && <nav className="border-b border-[var(--color-border)] bg-white p-3 md:hidden" aria-label="Admin navigation">{ADMIN_LINKS.map(({ label, href, icon: Icon }) => <NavLink key={href} to={href} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `flex items-center rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-[#171717] text-white' : 'text-neutral-700'}`}><Icon className="mr-3 h-4 w-4"/>{label}</NavLink>)}<p className="px-3 pt-3 text-xs text-neutral-500">Đăng nhập: {user?.fullName || user?.email || 'Admin'}</p></nav>}

        <header className="hidden items-center justify-between border-b border-neutral-200 bg-white px-8 py-3 md:flex">
          <div><p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Altera management</p><p className="text-sm font-semibold">{user?.fullName || user?.email || 'Admin'}</p></div>
          <Button variant="ghost" className="text-neutral-600" onClick={handleLogout}><LogOut className="mr-2 h-4 w-4"/>Sign out</Button>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto bg-[#f6f6f6] p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
