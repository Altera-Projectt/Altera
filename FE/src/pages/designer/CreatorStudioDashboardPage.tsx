import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, CircleDollarSign, PackageCheck, Palette, ShoppingBag } from 'lucide-react'
import api from '@/utils/axios'

type Profile = { username: string; displayName: string }
type Summary = { totalDesigns: number; publishedDesigns: number; totalSales: number; grossSales: number; paidOrders: number; commissionConfigured: boolean; designerEarnings: number | null }
type CreatorOrder = { _id: string; status: string; createdAt: string; items: { name: string; quantity: number; price: number; imageUrl?: string }[] }

export function CreatorStudioDashboardPage() {
  const [data, setData] = useState<{ profile: Profile; summary: Summary; orders: CreatorOrder[] } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([
      api.get<{ data: { profile: Profile } }>('/designers/me/profile'),
      api.get<{ data: Summary }>('/designers/me/summary'),
      api.get<{ data: { orders: CreatorOrder[] } }>('/designers/me/orders', { params: { limit: 6 } }),
    ]).then(([profile, summary, orders]) => {
      if (active) setData({ profile: profile.data.data.profile, summary: summary.data.data, orders: orders.data.data.orders })
    }).catch(() => { if (active) setError('Không thể tải studio. Vui lòng thử lại.') })
    return () => { active = false }
  }, [])

  if (error) return <div role="alert" className="mx-auto max-w-7xl px-6 py-24 text-center">{error}</div>
  if (!data) return <div aria-label="Đang tải studio" className="mx-auto max-w-7xl px-6 py-24 text-center text-sm text-neutral-500">Đang tải studio…</div>

  const { summary, profile } = data
  const metrics = [
    { label: 'All designs', value: summary.totalDesigns, icon: Palette },
    { label: 'Published', value: summary.publishedDesigns, icon: PackageCheck },
    { label: 'Paid orders', value: summary.paidOrders, icon: ShoppingBag },
    { label: 'Items sold', value: summary.totalSales, icon: ShoppingBag },
    { label: 'Gross sales', value: `${summary.grossSales.toLocaleString('vi-VN')} ₫`, icon: CircleDollarSign },
    { label: 'Your earnings', value: summary.commissionConfigured ? `${summary.designerEarnings?.toLocaleString('vi-VN')} ₫` : 'Chưa cấu hình', icon: CircleDollarSign },
  ]

  return <main className="mx-auto min-h-[70vh] max-w-7xl px-5 py-10 md:px-8">
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-neutral-200 pb-6"><div><p className="text-xs uppercase tracking-[.2em] text-neutral-500">Creator studio</p><h1 className="mt-2 text-4xl font-black uppercase">Xin chào, {profile.displayName}</h1><p className="mt-2 text-sm text-neutral-500">Theo dõi thiết kế và đơn hàng của bạn.</p></div><Link to={`/designer/${profile.username}`} className="inline-flex items-center gap-2 border px-4 py-2 text-xs font-semibold uppercase tracking-widest">Hồ sơ creator <ArrowUpRight size={15}/></Link></div>
    <section aria-label="Sales summary" className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{metrics.map(({ label, value, icon: Icon }) => <article key={label} className="border border-neutral-200 p-4"><Icon className="h-4 w-4 text-neutral-500"/><p className="mt-5 text-xl font-semibold">{value}</p><p className="mt-1 text-xs text-neutral-500">{label}</p></article>)}</section>
    {!summary.commissionConfigured && <p className="mt-4 text-xs text-neutral-500">Designer earnings sẽ hiện khi cấu hình DESIGNER_COMMISSION_RATE.</p>}
    <section className="mt-12"><div className="flex items-end justify-between border-b border-neutral-200 pb-4"><div><p className="text-xs uppercase tracking-widest text-neutral-500">Paid purchases</p><h2 className="mt-1 text-2xl font-bold uppercase">Đơn hàng thiết kế</h2></div><Link to={`/designer/${profile.username}`} className="text-xs underline">Quản lý thiết kế</Link></div>
      {!data.orders.length ? <p className="py-12 text-center text-sm text-neutral-500">Chưa có đơn hàng cho thiết kế của bạn.</p> : <div className="divide-y divide-neutral-200">{data.orders.map((order) => <article key={order._id} className="flex flex-wrap items-center gap-4 py-4">{order.items[0]?.imageUrl && <img src={order.items[0].imageUrl} alt="" loading="lazy" className="h-16 w-14 object-cover"/>}<div className="min-w-40 flex-1"><p className="font-medium">{order.items.map((item) => item.name).join(', ')}</p><p className="mt-1 text-xs text-neutral-500">{new Date(order.createdAt).toLocaleDateString('vi-VN')} · {order.items.reduce((count, item) => count + item.quantity, 0)} sản phẩm</p></div><span className="text-xs uppercase tracking-wider text-neutral-600">{order.status}</span><span className="text-sm font-semibold">{order.items.reduce((amount, item) => amount + item.price * item.quantity, 0).toLocaleString('vi-VN')} ₫</span></article>)}</div>}
    </section>
    <div className="mt-10 flex flex-wrap gap-3"><Link to="/design" className="bg-black px-5 py-3 text-xs font-semibold uppercase tracking-widest text-white">Start designing</Link><Link to="/marketplace" className="border px-5 py-3 text-xs font-semibold uppercase tracking-widest">Explore marketplace</Link></div>
  </main>
}
