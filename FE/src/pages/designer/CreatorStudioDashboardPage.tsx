import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, CircleDollarSign, PackageCheck, Palette, ShoppingBag } from 'lucide-react'
import api from '@/utils/axios'
import { optimizeCloudinaryUrl } from '@/utils/format'

type Profile = { username: string; displayName: string }
type Summary = {
  totalDesigns: number
  publishedDesigns: number
  totalSales: number
  grossSales: number
  paidOrders: number
  commissionConfigured: boolean
  commissionRate?: number
  platformFee?: number | null
  designerEarnings: number | null
}
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
  const commissionPercent = Math.round((summary.commissionRate ?? 0.05) * 100)
  const earnings = summary.designerEarnings ?? Math.round(summary.grossSales * (commissionPercent / 100))

  const metrics = [
    { label: 'Tổng thiết kế', value: summary.totalDesigns, icon: Palette },
    { label: 'Đang bán', value: summary.publishedDesigns, icon: PackageCheck },
    { label: 'Đơn đã thanh toán', value: summary.paidOrders, icon: ShoppingBag },
    { label: 'Sản phẩm đã bán', value: summary.totalSales, icon: ShoppingBag },
    {
      label: 'Tổng doanh số bán',
      sublabel: 'Tổng tiền khách trả',
      value: `${summary.grossSales.toLocaleString('vi-VN')} ₫`,
      icon: CircleDollarSign,
      highlight: false,
    },
    {
      label: `Hoa hồng thiết kế (${commissionPercent}%)`,
      sublabel: 'Thu nhập thực nhận',
      value: `${earnings.toLocaleString('vi-VN')} ₫`,
      icon: CircleDollarSign,
      highlight: true,
    },
  ]

  return (
    <main className="min-h-[75vh] bg-slate-50/50 pb-20">
      {/* ── Hero Banner Gradient Dark Navy ── */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#060B16] via-[#0A1122] to-[#0F172A] border-b border-blue-500/15 px-6 py-12 md:py-16 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/20 via-transparent to-transparent pointer-events-none" />
        <div className="relative mx-auto max-w-7xl flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 text-cyan-400 text-[11px] font-bold uppercase tracking-widest mb-3">
              KÊNH NHÀ THIẾT KẾ (CREATOR HUB)
            </div>
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-normal text-white">
              Xin chào, <span className="text-yellow-400 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_2px_14px_rgba(250,204,21,0.35)]">{profile.displayName}</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm md:text-base text-slate-300 leading-relaxed font-normal">
              Quản lý tác phẩm đã đăng bán, theo dõi đơn hàng và doanh thu bản quyền của bạn trên Marketplace.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to={`/designer/${profile.username}`}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-5 py-3 text-xs font-bold uppercase tracking-widest text-white backdrop-blur-md transition-all shadow-sm"
            >
              Hồ sơ Creator <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 md:px-8 mt-10">
        {/* ── Stat Cards ── */}
        <section aria-label="Tóm tắt doanh số" className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {metrics.map(({ label, sublabel, value, icon: Icon, highlight }) => (
            <article
              key={label}
              className={`group rounded-2xl border p-5 shadow-sm transition-all hover:-translate-y-0.5 ${
                highlight
                  ? 'border-cyan-400/50 bg-gradient-to-b from-cyan-50/60 to-blue-50/30 hover:border-cyan-400 hover:shadow-md'
                  : 'border-blue-100 bg-white hover:border-blue-300 hover:shadow-md'
              }`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                  highlight
                    ? 'bg-cyan-500 text-white shadow-sm'
                    : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <p className={`mt-4 text-xl md:text-2xl font-black tracking-normal ${highlight ? 'text-cyan-700' : 'text-slate-900'}`}>
                {value}
              </p>
              <p className="mt-1 text-xs font-bold text-slate-800">{label}</p>
              {sublabel && <p className="text-[10px] text-slate-500 mt-0.5">{sublabel}</p>}
            </article>
          ))}
        </section>

        <div className="mt-5 rounded-2xl border border-cyan-500/20 bg-slate-900 p-4 text-xs text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-cyan-400/20 text-cyan-400 font-bold text-xs shrink-0">
              ✓
            </span>
            <span>
              <strong className="text-cyan-400">Chính sách bản quyền ALTERA:</strong> Nhà thiết kế nhận{' '}
              <strong className="text-white">{commissionPercent}% hoa hồng bản quyền</strong> trên mỗi áo bán thành công (ví dụ: áo 379.000 đ nhận {((379000 * commissionPercent) / 100).toLocaleString('vi-VN')} đ). Sàn ALTERA chịu toàn bộ chi phí sản xuất phôi áo, in ấn DTF công nghệ cao, đóng gói và vận chuyển.
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400 shrink-0">
            Đối soát chuyển khoản định kỳ
          </span>
        </div>

        {/* ── Orders section ── */}
        <section className="mt-12 rounded-2xl border border-slate-200/80 bg-white p-6 md:p-8 shadow-sm">
          <div className="flex flex-wrap items-end justify-between border-b border-slate-100 pb-5 gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600">LỊCH SỬ BÁN HÀNG</p>
              <h2 className="mt-1 text-2xl font-bold uppercase tracking-normal text-slate-900">Đơn hàng thiết kế</h2>
            </div>
            <Link
              to={`/designer/${profile.username}`}
              className="text-xs font-semibold uppercase tracking-wider text-blue-600 hover:text-blue-800 hover:underline"
            >
              Quản lý trang trưng bày →
            </Link>
          </div>

          {!data.orders.length ? (
            <div className="py-16 text-center text-slate-400">
              <ShoppingBag className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <p className="text-base font-semibold text-slate-600">Chưa có đơn hàng nào cho thiết kế của bạn</p>
              <p className="mt-1 text-xs text-slate-400">Khi có người mua áo thiết kế của bạn trên Marketplace, đơn hàng sẽ xuất hiện ở đây.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 mt-2">
              {data.orders.map((order) => (
                <article key={order._id} className="flex flex-wrap items-center gap-4 py-4 hover:bg-slate-50/50 px-2 rounded-xl transition-colors">
                  {order.items[0]?.imageUrl && (
                    <img
                      src={optimizeCloudinaryUrl(order.items[0].imageUrl, 200)}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="h-16 w-14 rounded-lg object-contain bg-slate-100 border border-slate-200"
                    />
                  )}
                  <div className="min-w-40 flex-1">
                    <p className="font-semibold text-slate-900 text-sm">{order.items.map((item) => item.name).join(', ')}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString('vi-VN')} · {order.items.reduce((count, item) => count + item.quantity, 0)} sản phẩm
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-700">
                    {order.status}
                  </span>
                  <span className="text-base font-bold text-blue-600">
                    {order.items.reduce((amount, item) => amount + item.price * item.quantity, 0).toLocaleString('vi-VN')} ₫
                  </span>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* ── Quick Action Buttons ── */}
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            to="/design"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3.5 text-xs font-bold uppercase tracking-widest text-white shadow-md shadow-blue-500/20 transition-all hover:opacity-95 hover:shadow-lg"
          >
            Bắt đầu thiết kế
          </Link>
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-xs font-bold uppercase tracking-widest text-slate-800 transition-all hover:bg-slate-50 hover:border-slate-400 shadow-sm"
          >
            Khám phá Marketplace
          </Link>
        </div>
      </div>
    </main>
  )
}
