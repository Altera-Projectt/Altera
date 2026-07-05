import { Outlet, Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  LogOut,
  ChevronLeft,
  Menu,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui'

// ── Admin Sidebar Nav Links ────────────────────────────────────────────────

const ADMIN_LINKS = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Products', href: '/admin/products', icon: Package },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { label: 'Users', href: '/admin/users', icon: Users },
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
            <Button
              key={href}
              variant="ghost"
              className="w-full justify-start text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              asChild
            >
              <Link to={href}>
                <Icon className="mr-3 h-4 w-4" />
                {label}
              </Link>
            </Button>
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
          <Button variant="ghost" size="icon" aria-label="Menu">
            <Menu className="h-5 w-5" />
          </Button>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
