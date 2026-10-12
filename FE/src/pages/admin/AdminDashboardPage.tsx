import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, CreditCard, Package, Shirt, Users } from 'lucide-react'
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
  const kpis = data ? [
    { label: 'Tổng tài khoản', value: data.totalUsers, hint: `${data.activeUsers.toLocaleString()} đang hoạt động`, icon: Users },
    { label: 'Hồ sơ nhà thiết kế', value: data.designerProfiles, hint: `${data.totalCustomers.toLocaleString()} tài khoản người dùng`, icon: Users },
    { label: 'Thiết kế Marketplace', value: data.designs, hint: `${data.approvedDesigns.toLocaleString()} đã duyệt`, icon: Shirt },
    { label: 'Chờ duyệt', value: data.pendingDesigns, hint: 'Thiết kế cần kiểm duyệt', icon: Shirt, href: '/admin/designs?status=PENDING_REVIEW' },
    { label: 'Đơn hàng áo', value: data.totalOrders, hint: `${data.pendingOrders.toLocaleString()} đang xử lý`, icon: Package, href: '/admin/orders' },
    { label: 'Thanh toán chờ xử lý', value: data.pendingPayments, hint: `${data.failedPayments.toLocaleString()} thất bại`, icon: CreditCard, href: '/admin/payments' },
    { label: 'Doanh thu đã thanh toán', value: formatVND(data.revenue), hint: `Trong ${days} ngày · gồm đơn áo và hội viên`, icon: CreditCard },
    { label: 'Doanh thu đơn áo', value: formatVND(data.apparelRevenue), hint: 'Các khoản thanh toán đơn áo thành công', icon: Shirt },
    { label: 'Doanh thu hội viên', value: formatVND(data.membershipRevenue), hint: 'Các khoản thanh toán hội viên thành công', icon: CreditCard },
    { label: 'Giao dịch thành công', value: data.paidTransactions, hint: `Trong ${days} ngày`, icon: CreditCard },
    { label: 'Sản phẩm đang bán', value: data.activeProducts, hint: 'Sản phẩm áo hoạt động', icon: Package, href: '/admin/products' },
  ] : []

  return <section className="mx-auto max-w-[1500px] space-y-7">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#ff6b4a]">ALTERA · ADMIN</p><h1 className="mt-2 text-3xl font-bold normal-case tracking-tight">Tổng quan</h1><p className="mt-2 text-sm text-neutral-500">Theo dõi hoạt động tài khoản, thiết kế và đơn hàng từ dữ liệu hệ thống.</p></div>
      <label className="flex items-center gap-2 text-sm text-neutral-600">Khoảng thời gian<select value={days} onChange={(event) => { setLoading(true); setError(''); setDays(Number(event.target.value)) }} className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-neutral-900"><option value={7}>7 ngày</option><option value={30}>30 ngày</option><option value={90}>90 ngày</option></select></label>
    </div>
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
    {loading && !data ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }, (_, index) => <div key={index} className="h-32 animate-pulse rounded-xl bg-neutral-200" />)}</div> : data && <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{kpis.map(({ label, value, hint, icon: Icon, href }) => {
        const card = <article className="h-full rounded-xl border border-neutral-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><p className="text-sm font-medium text-neutral-500">{label}</p><Icon className="h-5 w-5 text-[#ff6b4a]" /></div><p className="mt-4 text-2xl font-bold tracking-tight">{typeof value === 'number' ? value.toLocaleString() : value}</p><p className="mt-2 text-xs text-neutral-500">{hint}</p></article>
        return href ? <Link key={label} to={href} className="block transition-transform hover:-translate-y-0.5">{card}</Link> : <div key={label}>{card}</div>
      })}</div>
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <article className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><div><h2 className="text-lg font-semibold normal-case tracking-normal">Doanh thu đã thanh toán</h2><p className="mt-1 text-sm text-neutral-500">Tổng {formatVND(data.revenue)} trong {days} ngày qua</p></div><span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-[#c94a2f]">{days} ngày</span></div>
          {data.revenueByDay.length ? <div className="mt-7 flex h-52 items-end gap-1 overflow-x-auto border-b border-neutral-200 pb-2">{data.revenueByDay.map((day, index) => <div key={day._id} className="group flex h-full min-w-5 flex-1 flex-col justify-end" title={`${day._id}: ${formatVND(day.revenue)} · ${day.transactions} giao dịch`}><div className="w-full rounded-t bg-[#ff6b4a] transition-colors group-hover:bg-[#e65235]" style={{ height: `${Math.max(4, day.revenue / maxRevenue * 100)}%` }} /><span className={`mt-2 text-center text-[10px] text-neutral-500 ${days <= 7 || index % Math.max(1, Math.ceil(data.revenueByDay.length / 7)) === 0 || index === data.revenueByDay.length - 1 ? '' : 'invisible'}`}>{day._id.slice(5)}</span></div>)}</div> : <p className="mt-8 rounded-lg bg-neutral-50 p-8 text-center text-sm text-neutral-500">Chưa có khoản thanh toán thành công trong khoảng thời gian này.</p>}
        </article>
        <article className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold normal-case tracking-normal">Thiết kế chờ duyệt</h2><p className="mt-1 text-sm text-neutral-500">{data.pendingDesigns.toLocaleString()} thiết kế đang chờ</p></div><Link to="/admin/designs?status=PENDING_REVIEW" className="inline-flex items-center gap-1 text-sm font-semibold text-[#d95337]">Mở danh sách <ArrowUpRight className="h-4 w-4" /></Link></div>
          <div className="mt-4 divide-y divide-neutral-100">{data.recentDesigns.map((design) => <div key={design._id} className="flex items-center gap-3 py-3"><img src={design.thumbnail || ''} alt="" className="h-12 w-12 rounded-lg bg-neutral-100 object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{design.name}</p><p className="text-xs text-neutral-500">{design.designerId?.displayName || 'Nhà thiết kế'} · {new Date(design.createdAt).toLocaleDateString('vi-VN')}</p></div><Link to="/admin/designs" className="text-xs font-semibold text-[#d95337]">Xem</Link></div>)}{!data.recentDesigns.length && <p className="py-8 text-center text-sm text-neutral-500">Không có thiết kế chờ duyệt.</p>}</div>
        </article>
      </div>
      <article className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm"><div className="flex items-center justify-between p-5"><div><h2 className="text-lg font-semibold normal-case tracking-normal">Đơn áo gần đây</h2><p className="mt-1 text-sm text-neutral-500">Trạng thái xử lý đơn và thanh toán được theo dõi riêng.</p></div><Link to="/admin/orders" className="text-sm font-semibold text-[#d95337]">Tất cả đơn hàng <ArrowUpRight className="inline h-4 w-4" /></Link></div><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500"><tr><th className="px-5 py-3">Mã đơn</th><th className="px-5 py-3">Khách hàng</th><th className="px-5 py-3">Tổng tiền</th><th className="px-5 py-3">Trạng thái đơn</th><th className="px-5 py-3">Trạng thái thanh toán</th><th className="px-5 py-3">Ngày tạo</th></tr></thead><tbody>{data.recentOrders.map((order) => <tr key={order._id} className="border-t border-neutral-100"><td className="px-5 py-3 font-medium">#{order._id.slice(-8).toUpperCase()}</td><td className="px-5 py-3">{order.userId?.fullName || order.userId?.email || '—'}</td><td className="px-5 py-3">{formatVND(order.totalPrice)}</td><td className="px-5 py-3">{orderStatusLabel[order.status] || order.status}</td><td className="px-5 py-3">{orderStatusLabel[order.paymentStatus] || order.paymentStatus}</td><td className="px-5 py-3">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</td></tr>)}</tbody></table>{!data.recentOrders.length && <p className="p-8 text-center text-sm text-neutral-500">Chưa có đơn hàng.</p>}</div></article>
    </>}
  </section>
}
