import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { LayoutDashboard, ShoppingCart, CreditCard, Users, LogOut, ChevronLeft, Menu, Shirt, UserRound, Box } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui'

const ADMIN_LINKS = [
  { label: 'Tổng quan', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Áo đang bán (Marketplace)', href: '/admin/designs', icon: Shirt },
  { label: 'Đơn hàng áo', href: '/admin/orders', icon: ShoppingCart },
  { label: 'Thanh toán', href: '/admin/payments', icon: CreditCard },
  { label: 'Thanh toán thành viên', href: '/admin/membership-payments', icon: CreditCard },
  { label: 'Khách hàng', href: '/admin/customers', icon: Users },
  { label: 'Tài khoản', href: '/admin/users', icon: Users },
  { label: 'Kho Phôi Áo (Base)', href: '/admin/products', icon: Box },
]

export function AdminLayout() {
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const navItems = (mobile = false) => ADMIN_LINKS.map(({ label, href, icon: Icon }) => (
    <NavLink key={href} to={href} end={href === '/admin/dashboard'} onClick={() => mobile && setMobileMenuOpen(false)} title={sidebarCollapsed && !mobile ? label : undefined} className={({ isActive }) => `flex min-h-10 items-center rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-cyan-400 ${sidebarCollapsed && !mobile ? 'justify-center' : ''} ${isActive ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white' : 'text-slate-400 hover:bg-white/[0.07] hover:text-white'}`}>
      <Icon aria-hidden="true" className={`h-4 w-4 shrink-0 ${sidebarCollapsed && !mobile ? '' : 'mr-3'}`} />{(!sidebarCollapsed || mobile) && <span className="truncate">{label}</span>}
    </NavLink>
  ))

  return (
    <div className="flex min-h-screen bg-[#060B16] text-slate-100">
      <aside className={`hidden shrink-0 flex-col border-r border-blue-500/15 bg-[#0A1122] transition-[width] duration-200 md:flex ${sidebarCollapsed ? 'w-[76px]' : 'w-[248px]'}`}>
        <div className={`flex h-[68px] items-center border-b border-blue-500/15 ${sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-5'}`}>
          <Link to="/admin" aria-label="Altera Admin" className="min-w-0 font-heading text-sm font-black tracking-[.12em] text-white hover:text-cyan-300 focus-visible:outline-cyan-400"><span className="text-cyan-400">A</span>{!sidebarCollapsed && <><span className="ml-1">ALTERA</span><span className="block pl-5 text-[10px] font-normal tracking-widest text-slate-400">ADMIN</span></>}</Link>
          {!sidebarCollapsed && <button type="button" aria-label="Thu gọn thanh điều hướng" onClick={() => setSidebarCollapsed(true)} className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white focus-visible:outline-cyan-400"><ChevronLeft className="h-4 w-4" /></button>}
        </div>
        {sidebarCollapsed && <button type="button" aria-label="Mở rộng thanh điều hướng" onClick={() => setSidebarCollapsed(false)} className="mx-auto mt-3 rounded p-2 text-slate-400 hover:bg-white/10 hover:text-white focus-visible:outline-cyan-400"><Menu className="h-4 w-4" /></button>}
        <nav className="flex-1 space-y-1 p-3" aria-label="Điều hướng quản trị">{navItems()}</nav>
        <div className="border-t border-blue-500/15 p-3">
          <Button variant="outline" className={`w-full border-blue-500/20 text-slate-200 hover:bg-white/10 hover:text-white ${sidebarCollapsed ? 'justify-center px-2' : 'justify-start'}`} asChild><Link to="/" title={sidebarCollapsed ? 'Về cửa hàng' : undefined}><ChevronLeft className={`h-4 w-4 ${sidebarCollapsed ? '' : 'mr-2'}`} />{!sidebarCollapsed && 'Về cửa hàng'}</Link></Button>
          <button type="button" onClick={handleLogout} title={sidebarCollapsed ? 'Đăng xuất' : undefined} className={`mt-2 flex h-10 w-full items-center rounded-md px-3 text-sm text-slate-400 hover:bg-white/[0.07] hover:text-red-300 focus-visible:outline-cyan-400 ${sidebarCollapsed ? 'justify-center' : ''}`}><LogOut className={`h-4 w-4 ${sidebarCollapsed ? '' : 'mr-3'}`} />{!sidebarCollapsed && 'Đăng xuất'}</button>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-20 flex h-[60px] shrink-0 items-center justify-between gap-3 border-b border-blue-500/15 bg-[#0A1122]/95 px-4 backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" aria-label="Mở hoặc đóng điều hướng quản trị" aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen((open) => !open)} className="rounded p-2 text-slate-300 hover:bg-white/10 focus-visible:outline-cyan-400 md:hidden"><Menu className="h-5 w-5" /></button>
            {sidebarCollapsed && <button type="button" aria-label="Mở rộng thanh điều hướng" onClick={() => setSidebarCollapsed(false)} className="hidden rounded p-2 text-slate-300 hover:bg-white/10 focus-visible:outline-cyan-400 md:inline-flex"><Menu className="h-5 w-5" /></button>}
            <Link to="/admin" className="font-heading text-sm font-black tracking-widest text-white md:hidden"><span className="text-cyan-400">A</span> ALTERA ADMIN</Link>
            <div className="hidden min-w-0 items-center gap-2 rounded-full border border-blue-500/20 bg-[#0F172A] px-3 py-2 text-xs text-slate-400 sm:flex sm:w-64 lg:w-[min(32vw,400px)]"><span className="text-base leading-none">⌕</span><span>Tìm kiếm</span></div>
          </div>
          <div className="flex min-w-0 items-center gap-3">
            <span className="hidden max-w-56 truncate text-xs text-slate-400 sm:block">{user?.fullName || user?.email || 'Quản trị viên'}</span>
            <span aria-label={`Tài khoản ${user?.fullName || 'quản trị viên'}`} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-blue-500/20 text-slate-200"><UserRound className="h-4 w-4" /></span>
            <button type="button" onClick={handleLogout} className="hidden items-center gap-1 rounded px-2 py-1.5 text-xs text-slate-400 hover:bg-white/10 hover:text-white focus-visible:outline-cyan-400 lg:inline-flex"><LogOut className="h-4 w-4" />Đăng xuất</button>
          </div>
        </header>
        {mobileMenuOpen && <nav className="space-y-1 border-b border-blue-500/15 bg-[#0A1122] p-3 md:hidden" aria-label="Điều hướng quản trị">{navItems(true)}<div className="border-t border-blue-500/15 pt-3"><Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center rounded-md px-3 py-2 text-sm text-slate-300"><ChevronLeft className="mr-2 h-4 w-4" />Về cửa hàng</Link><button type="button" onClick={handleLogout} className="flex w-full items-center rounded-md px-3 py-2 text-sm text-slate-400"><LogOut className="mr-2 h-4 w-4" />Đăng xuất</button></div></nav>}
        <main className="min-h-0 flex-1 overflow-y-auto bg-[#060B16] p-4 sm:p-6 lg:p-7"><Outlet /></main>
      </div>
    </div>
  )
}
