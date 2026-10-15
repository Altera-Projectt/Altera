import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, CreditCard, Package, Shirt, Users, Box } from 'lucide-react'
import { AdminService } from '@/services/admin.api'
import { formatVND } from '@/utils/format'

type DashboardData = {
  totalCustomers: number; totalUsers: number; activeUsers: number; designerProfiles: number
  designs: number; pendingDesigns: number; approvedDesigns: number; totalOrders: number
  pendingOrders: number; activeProducts: number; pendingPayments: number; failedPayments: number
  revenue: number; apparelRevenue: number; membershipRevenue: number; paidTransactions: number
  revenueByDay: Array<{ _id: string; revenue: number; transactions: number }>
  recentOrders: Array<{ _id: string; createdAt: string; totalPrice: number; status: string; paymentStatus: string; userId?: { fullName?: string; email?: string } }>
  recentDesigns: Array<{ _id: string; name: string; thumbnail?: string; createdAt: string; designerId?: { displayName?: string } }>
}

const errorText = (error: unknown) => (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Không thể tải dữ liệu tổng quan.'
const orderStatusLabel: Record<string, string> = { PENDING: 'Chờ xác nhận', CONFIRMED: 'Đã xác nhận', SHIPPING: 'Đang giao', DELIVERED: 'Đã giao', CANCELLED: 'Đã hủy', PAID: 'Đã thanh toán', FAILED: 'Thất bại', EXPIRED: 'Hết hạn' }
const statusColor: Record<string, string> = { PENDING: 'text-red-400', CONFIRMED: 'text-sky-300', SHIPPING: 'text-amber-300', DELIVERED: 'text-emerald-400', CANCELLED: 'text-neutral-400' }
const panel = 'min-w-0 rounded-xl border border-blue-400/15 bg-[#0F172A] p-4 sm:p-5 shadow-lg shadow-black/20'

export function AdminDashboardPage() {
  const [days, setDays] = useState(30)
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let current = true
    AdminService.dashboard({ days }).then((response) => { if (current) setData(response.data.data as DashboardData) })
      .catch((reason: unknown) => { if (current) setError(errorText(reason)) })
      .finally(() => { if (current) setLoading(false) })
    return () => { current = false }
  }, [days])

  const maxRevenue = useMemo(() => Math.max(1, ...(data?.revenueByDay.map((day) => day.revenue) ?? [])), [data])
  const orderStatusCounts = useMemo(() => {
    const counts = new Map<string, number>()
    data?.recentOrders.forEach((order) => counts.set(order.status, (counts.get(order.status) ?? 0) + 1))
    return [...counts.entries()]
  }, [data])
  const kpis = data ? [
    { label: 'Tổng tài khoản', value: data.totalUsers, hint: `${data.activeUsers.toLocaleString()} đang hoạt động`, icon: Users },
    { label: 'Hồ sơ nhà thiết kế', value: data.designerProfiles, hint: `${data.totalCustomers.toLocaleString()} tài khoản người dùng`, icon: Users },
    { label: 'Mẫu thiết kế trên sàn', value: data.designs, hint: `${data.approvedDesigns.toLocaleString()} đã duyệt`, icon: Shirt },
    { label: 'Thiết kế chờ duyệt', value: data.pendingDesigns, hint: 'Thiết kế cần kiểm duyệt', icon: Shirt, href: '/admin/designs?status=PENDING_REVIEW' },
    { label: 'Đơn hàng áo', value: data.totalOrders, hint: `${data.pendingOrders.toLocaleString()} đang xử lý`, icon: Package, href: '/admin/orders' },
    { label: 'Thanh toán chờ xử lý', value: data.pendingPayments, hint: `${data.failedPayments.toLocaleString()} thất bại`, icon: CreditCard, href: '/admin/payments' },
    { label: 'Doanh thu đã thanh toán', value: formatVND(data.revenue), hint: `Trong ${days} ngày · gồm đơn áo và hội viên`, icon: CreditCard },
    { label: 'Doanh thu hội viên', value: formatVND(data.membershipRevenue), hint: 'Thanh toán hội viên thành công', icon: CreditCard },
    { label: 'Đơn hàng thành công', value: data.paidTransactions, hint: `Giao dịch đã thanh toán trong ${days} ngày`, icon: CreditCard },
    { label: 'Doanh thu đơn áo', value: formatVND(data.apparelRevenue), hint: 'Thanh toán đơn áo thành công', icon: Shirt },
    { label: 'Kho phôi áo (Base)', value: data.activeProducts, hint: 'Mẫu phôi hoạt động cho Studio 3D', icon: Box, href: '/admin/products' },
  ] : []

  return <section className="mx-auto max-w-[1500px] space-y-5 text-slate-100 sm:space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs font-bold uppercase tracking-[.18em] text-cyan-400">ALTERA · ADMIN</p><h1 className="mt-2 text-2xl font-bold normal-case tracking-tight text-white sm:text-3xl">Tổng quan</h1><p className="mt-2 text-sm text-slate-400">Theo dõi hoạt động tài khoản, thiết kế và đơn hàng từ dữ liệu hệ thống.</p></div>
      <label className="flex items-center gap-2 text-sm text-slate-400">Khoảng thời gian<select value={days} onChange={(event) => { setLoading(true); setError(''); setDays(Number(event.target.value)) }} className="rounded-lg border border-blue-400/20 bg-[#162038] px-3 py-2 text-white focus:border-cyan-400 focus:outline-none"><option value={7} className="bg-[#0F172A] text-white">7 ngày</option><option value={30} className="bg-[#0F172A] text-white">30 ngày</option><option value={90} className="bg-[#0F172A] text-white">90 ngày</option></select></label>
    </div>
    {error && <div role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">{error}</div>}
    {loading && !data ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 9 }, (_, index) => <div key={index} className="h-32 animate-pulse rounded-xl border border-blue-400/10 bg-[#0F172A]/60" />)}</div> : data && <>
      <div className="grid gap-4 lg:grid-cols-2">
        <article className={panel}><div className="flex items-center justify-between border-b border-blue-400/15 pb-3"><div><h2 className="text-sm font-semibold normal-case tracking-normal text-slate-100">Tổng quan doanh số</h2><p className="mt-1 text-xs text-slate-400">{formatVND(data.revenue)} · {days} ngày gần nhất</p></div><span className="text-xs text-slate-400">{days} ngày</span></div>
          {data.revenueByDay.length ? <div className="mt-5 flex h-48 items-end gap-1 overflow-x-auto border-b border-blue-400/15 pb-2 sm:h-56">{data.revenueByDay.map((day, index) => <div key={day._id} className="group flex h-full min-w-3 flex-1 flex-col justify-end" title={`${day._id}: ${formatVND(day.revenue)} · ${day.transactions} giao dịch`}><div className="w-full rounded-t-sm bg-cyan-400/80 transition-colors group-hover:bg-cyan-300" style={{ height: `${Math.max(4, day.revenue / maxRevenue * 100)}%` }} /><span className={`mt-2 text-center text-[9px] text-slate-500 ${days <= 7 || index % Math.max(1, Math.ceil(data.revenueByDay.length / 7)) === 0 || index === data.revenueByDay.length - 1 ? '' : 'invisible'}`}>{day._id.slice(5)}</span></div>)}</div> : <p className="mt-5 flex h-48 items-center justify-center text-sm text-slate-400">Chưa có khoản thanh toán thành công trong khoảng thời gian này.</p>}
        </article>
        <article className={panel}><div className="flex items-center justify-between border-b border-blue-400/15 pb-3"><div><h2 className="text-sm font-semibold normal-case tracking-normal text-slate-100">Báo cáo đơn hàng</h2><p className="mt-1 text-xs text-slate-400">Phân loại {data.recentOrders.length} đơn gần đây theo trạng thái</p></div><Link to="/admin/orders" aria-label="Xem tất cả đơn hàng" className="rounded p-1 text-slate-400 hover:text-cyan-300 focus-visible:outline-cyan-400"><ArrowUpRight className="h-4 w-4" /></Link></div>
          {orderStatusCounts.length ? <div className="mt-5 flex min-h-48 flex-col justify-center gap-4 sm:min-h-56">{orderStatusCounts.map(([status, count]) => <div key={status}><div className="mb-1.5 flex justify-between gap-3 text-xs"><span className={statusColor[status] ?? 'text-slate-300'}>{orderStatusLabel[status] || status}</span><span className="text-slate-400">{count}</span></div><div className="h-2 overflow-hidden rounded bg-blue-950/60 border border-blue-400/10"><div className="h-full rounded bg-cyan-400" style={{ width: `${count / data.recentOrders.length * 100}%` }} /></div></div>)}</div> : <p className="mt-5 flex h-48 items-center justify-center text-sm text-slate-400">Chưa có đơn hàng gần đây.</p>}
        </article>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{kpis.map(({ label, value, hint, icon: Icon, href }) => {
        const card = <article className="flex h-full min-h-32 flex-col rounded-xl border border-blue-400/15 bg-[#0F172A] p-4 sm:p-5 shadow-lg shadow-black/20"><div className="flex items-start justify-between gap-3 border-b border-blue-400/15 pb-3"><p className="min-w-0 text-sm font-medium leading-snug text-slate-200">{label}</p><Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-cyan-400" /></div><p className="mt-3 break-words text-2xl font-semibold tracking-tight text-cyan-400">{typeof value === 'number' ? value.toLocaleString() : value}</p><p className="mt-auto pt-3 text-xs leading-relaxed text-slate-400">{hint}</p></article>
        return href ? <Link key={label} to={href} className="block rounded-xl transition-all hover:border-cyan-400/50 hover:shadow-cyan-500/10 focus-visible:outline-cyan-400">{card}</Link> : <div key={label}>{card}</div>
      })}</div>
      <article className="overflow-hidden rounded-xl border border-blue-400/15 bg-[#0F172A] shadow-lg shadow-black/20"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-400/15 p-4 sm:p-5"><div><h2 className="text-base font-semibold normal-case tracking-normal text-cyan-400">Đơn hàng áo gần đây</h2><p className="mt-1 text-xs text-slate-400">Trạng thái xử lý đơn và thanh toán được theo dõi riêng.</p></div><Link to="/admin/orders" className="text-xs font-semibold text-cyan-300 hover:text-cyan-200">Tất cả đơn hàng <ArrowUpRight aria-hidden="true" className="inline h-4 w-4" /></Link></div><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-xs"><thead className="bg-[#162038]/80 text-[10px] uppercase tracking-wider font-semibold text-slate-300 border-b border-blue-400/15"><tr><th className="px-4 py-2.5">Mã đơn</th><th className="px-4 py-2.5">Khách hàng</th><th className="px-4 py-2.5">Tổng tiền</th><th className="px-4 py-2.5">Trạng thái đơn hàng</th><th className="px-4 py-2.5">Ngày tạo đơn</th></tr></thead><tbody>{data.recentOrders.map((order) => <tr key={order._id} className="border-t border-blue-400/10 text-slate-300 hover:bg-blue-500/[0.05] transition-colors"><td className="whitespace-nowrap px-4 py-2.5 font-medium text-cyan-400">#{order._id.slice(-8).toUpperCase()}</td><td className="max-w-48 truncate px-4 py-2.5">{order.userId?.fullName || order.userId?.email || '—'}</td><td className="whitespace-nowrap px-4 py-2.5 font-semibold text-cyan-400">{formatVND(order.totalPrice)}</td><td className={`whitespace-nowrap px-4 py-2.5 font-medium ${statusColor[order.status] ?? 'text-slate-300'}`}>{orderStatusLabel[order.status] || order.status}</td><td className="whitespace-nowrap px-4 py-2.5 text-slate-400">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</td></tr>)}</tbody></table>{!data.recentOrders.length && <p className="p-8 text-center text-sm text-slate-400">Chưa có đơn hàng.</p>}</div></article>
    </>}
  </section>
}
