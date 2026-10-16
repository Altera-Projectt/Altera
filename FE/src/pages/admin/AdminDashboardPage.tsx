import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, CreditCard, Package, Shirt, Users, Box } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AdminService } from '@/services/admin.api'
import { formatVND, formatVNDShort } from '@/utils/format'

type RevenueDayItem = {
  _id: string
  label?: string
  revenue: number
  apparelRevenue?: number
  membershipRevenue?: number
  transactions: number
}

type DashboardData = {
  totalCustomers: number
  totalUsers: number
  activeUsers: number
  designerProfiles: number
  designs: number
  pendingDesigns: number
  approvedDesigns: number
  totalOrders: number
  pendingOrders: number
  activeProducts: number
  pendingPayments: number
  failedPayments: number
  revenue: number
  apparelRevenue: number
  membershipRevenue: number
  paidTransactions: number
  revenueByDay: Array<RevenueDayItem>
  revenueChart?: Array<RevenueDayItem>
  recentOrders: Array<{
    _id: string
    createdAt: string
    totalPrice: number
    status: string
    paymentStatus: string
    userId?: { fullName?: string; email?: string }
  }>
  recentDesigns: Array<{
    _id: string
    name: string
    thumbnail?: string
    createdAt: string
    designerId?: { displayName?: string }
  }>
}

type RevenueChartPoint = {
  key: string
  label: string
  tooltipLabel: string
  revenue: number
  apparelRevenue: number
  transactions: number
}

const TIME_RANGES: Array<{ label: string; value: 7 | 30 | 90 }> = [
  { label: '7 ngày', value: 7 },
  { label: '30 ngày', value: 30 },
  { label: '3 tháng', value: 90 },
]

const errorText = (error: unknown) =>
  (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
  'Không thể tải dữ liệu tổng quan.'

const orderStatusLabel: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  SHIPPING: 'Đang giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã hủy',
  PAID: 'Đã thanh toán',
  FAILED: 'Thất bại',
  EXPIRED: 'Hết hạn',
}

const statusColor: Record<string, string> = {
  PENDING: 'text-red-400',
  CONFIRMED: 'text-sky-300',
  SHIPPING: 'text-amber-300',
  DELIVERED: 'text-emerald-400',
  CANCELLED: 'text-neutral-400',
}

const panel =
  'min-w-0 rounded-xl border border-blue-400/15 bg-[#0F172A] p-4 sm:p-5 shadow-lg shadow-black/20'

export function AdminDashboardPage() {
  const [days, setDays] = useState<7 | 30 | 90>(30)
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let current = true
    AdminService.dashboard({ days })
      .then((response) => {
        if (current) setData(response.data.data as DashboardData)
      })
      .catch((reason: unknown) => {
        if (current) setError(errorText(reason))
      })
      .finally(() => {
        if (current) setLoading(false)
      })
    return () => {
      current = false
    }
  }, [days])

  const handleSelectRange = (nextDays: 7 | 30 | 90) => {
    if (nextDays === days) return
    setLoading(true)
    setError('')
    setDays(nextDays)
  }

  const rangeLabel = useMemo(
    () => TIME_RANGES.find((item) => item.value === days)?.label ?? `${days} ngày`,
    [days]
  )

  const revenueChartData = useMemo<RevenueChartPoint[]>(() => {
    const rawDays = data?.revenueByDay ?? []
    const totalRev = Number(data?.revenue ?? 0)
    const totalApparel = Number(data?.apparelRevenue ?? 0)
    const fallbackRatio = totalRev > 0 ? Math.min(1, Math.max(0, totalApparel / totalRev)) : 0

    const byDate = new Map<
      string,
      { revenue: number; apparelRevenue: number; transactions: number }
    >()

    for (const item of rawDays) {
      const rev = Number(item.revenue ?? 0)
      const apparel =
        item.apparelRevenue !== undefined
          ? Number(item.apparelRevenue)
          : Math.round(rev * fallbackRatio)
      byDate.set(item._id, {
        revenue: rev,
        apparelRevenue: apparel,
        transactions: Number(item.transactions ?? 0),
      })
    }

    const now = new Date()

    if (days === 90) {
      const monthMap = new Map<string, RevenueChartPoint>()
      for (let offset = 2; offset >= 0; offset -= 1) {
        const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1))
        const ym = d.toISOString().slice(0, 7)
        const mm = ym.slice(5, 7)
        const yyyy = ym.slice(0, 4)
        monthMap.set(ym, {
          key: ym,
          label: `Tháng ${mm}/${yyyy}`,
          tooltipLabel: `Tháng ${mm}/${yyyy}`,
          revenue: 0,
          apparelRevenue: 0,
          transactions: 0,
        })
      }

      for (const [dateStr, values] of byDate.entries()) {
        const ym = String(dateStr).slice(0, 7)
        if (!monthMap.has(ym)) {
          const mm = ym.slice(5, 7)
          const yyyy = ym.slice(0, 4)
          monthMap.set(ym, {
            key: ym,
            label: `Tháng ${mm}/${yyyy}`,
            tooltipLabel: `Tháng ${mm}/${yyyy}`,
            revenue: 0,
            apparelRevenue: 0,
            transactions: 0,
          })
        }
        const bucket = monthMap.get(ym)!
        bucket.revenue += values.revenue
        bucket.apparelRevenue += values.apparelRevenue
        bucket.transactions += values.transactions
      }

      return [...monthMap.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, point]) => point)
    }

    const dailyPoints: RevenueChartPoint[] = []
    for (let offset = days - 1; offset >= 0; offset -= 1) {
      const d = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - offset)
      )
      const dateKey = d.toISOString().slice(0, 10)
      const [yyyy, mm, dd] = dateKey.split('-')
      const found = byDate.get(dateKey)
      dailyPoints.push({
        key: dateKey,
        label: `${dd}/${mm}`,
        tooltipLabel: `Ngày ${dd}/${mm}/${yyyy}`,
        revenue: found ? found.revenue : 0,
        apparelRevenue: found ? found.apparelRevenue : 0,
        transactions: found ? found.transactions : 0,
      })
    }

    return dailyPoints
  }, [data, days])

  const orderStatusCounts = useMemo(() => {
    const counts = new Map<string, number>()
    data?.recentOrders.forEach((order) =>
      counts.set(order.status, (counts.get(order.status) ?? 0) + 1)
    )
    return [...counts.entries()]
  }, [data])

  const kpis = data
    ? [
        {
          label: 'Tổng tài khoản',
          value: data.totalUsers,
          hint: `${data.activeUsers.toLocaleString()} đang hoạt động`,
          icon: Users,
        },
        {
          label: 'Hồ sơ nhà thiết kế',
          value: data.designerProfiles,
          hint: `${data.totalCustomers.toLocaleString()} tài khoản người dùng`,
          icon: Users,
        },
        {
          label: 'Mẫu thiết kế trên sàn',
          value: data.designs,
          hint: `${data.approvedDesigns.toLocaleString()} đã duyệt`,
          icon: Shirt,
        },
        {
          label: 'Đơn hàng áo',
          value: data.totalOrders,
          hint: `${data.pendingOrders.toLocaleString()} đang xử lý`,
          icon: Package,
          href: '/admin/orders',
        },
        {
          label: 'Thanh toán chờ xử lý',
          value: data.pendingPayments,
          hint: `${data.failedPayments.toLocaleString()} thất bại`,
          icon: CreditCard,
          href: '/admin/payments',
        },
        {
          label: 'Doanh thu đã thanh toán',
          value: formatVND(data.revenue),
          hint: `Trong ${rangeLabel} · gồm đơn áo và hội viên`,
          icon: CreditCard,
        },
        {
          label: 'Doanh thu đơn áo',
          value: formatVND(data.apparelRevenue),
          hint: 'Thanh toán đơn áo thành công',
          icon: Shirt,
        },
        {
          label: 'Doanh thu hội viên',
          value: formatVND(data.membershipRevenue),
          hint: 'Thanh toán hội viên thành công',
          icon: CreditCard,
        },
        {
          label: 'Đơn hàng thành công',
          value: data.paidTransactions,
          hint: `Giao dịch đã thanh toán trong ${rangeLabel}`,
          icon: CreditCard,
        },
        {
          label: 'Kho phôi áo (Base)',
          value: data.activeProducts,
          hint: 'Mẫu phôi hoạt động cho Studio 3D',
          icon: Box,
          href: '/admin/products',
        },
      ]
    : []

  return (
    <section className="mx-auto max-w-[1500px] space-y-5 text-slate-100 sm:space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-cyan-400">
            ALTERA · ADMIN
          </p>
          <h1 className="mt-2 text-2xl font-bold normal-case tracking-normal text-slate-100 sm:text-3xl">
            Tổng quan
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Theo dõi hoạt động tài khoản, thiết kế và đơn hàng từ dữ liệu hệ thống.
          </p>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300"
        >
          {error}
        </div>
      )}

      {loading && !data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 10 }, (_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-xl border border-blue-400/10 bg-[#0F172A]/60"
            />
          ))}
        </div>
      ) : (
        data && (
          <>
            <div className="grid gap-4 lg:grid-cols-2">
              <article className={panel}>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-400/15 pb-3">
                  <div>
                    <h2 className="text-sm font-semibold normal-case tracking-normal text-slate-100">
                      Tổng quan doanh số
                    </h2>
                    <p className="mt-1 text-xs text-slate-400">
                      Tổng thanh toán: <span className="font-semibold text-cyan-400">{formatVND(data.revenue)}</span> · Đơn áo: <span className="font-semibold text-rose-400">{formatVND(data.apparelRevenue)}</span> ({rangeLabel} gần nhất)
                    </p>
                  </div>
                  <div
                    role="group"
                    aria-label="Bộ lọc khoảng thời gian doanh thu"
                    className="inline-flex items-center gap-1 rounded-lg border border-blue-400/20 bg-[#0A1122] p-1"
                  >
                    {TIME_RANGES.map((range) => {
                      const active = days === range.value
                      return (
                        <button
                          key={range.value}
                          type="button"
                          onClick={() => handleSelectRange(range.value)}
                          aria-pressed={active}
                          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                            active
                              ? 'bg-blue-600 text-slate-100 shadow-sm shadow-blue-500/30'
                              : 'text-slate-400 hover:bg-[#162038] hover:text-slate-100'
                          }`}
                        >
                          {range.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="mt-4 h-64 w-full sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={revenueChartData}
                      margin={{ top: 10, right: 8, left: 0, bottom: 4 }}
                      barGap={days === 30 ? 2 : 6}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(56, 189, 248, 0.12)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        tickLine={false}
                        axisLine={{ stroke: 'rgba(56, 189, 248, 0.2)' }}
                        minTickGap={days === 30 ? 14 : 6}
                      />
                      <YAxis
                        tickFormatter={(value: number) =>
                          value === 0 ? '0 ₫' : formatVNDShort(Number(value))
                        }
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        width={68}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(22, 32, 56, 0.65)' }}
                        contentStyle={{
                          backgroundColor: '#0A1122',
                          borderColor: 'rgba(34, 211, 238, 0.3)',
                          borderRadius: '0.5rem',
                          color: '#f1f5f9',
                          fontSize: '12px',
                        }}
                        labelFormatter={(_, payload) => {
                          const first = payload?.[0]?.payload as RevenueChartPoint | undefined
                          return first?.tooltipLabel ?? ''
                        }}
                        formatter={(value, name) => [
                          formatVND(Number(value ?? 0)),
                          String(name),
                        ]}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={32}
                        wrapperStyle={{ fontSize: '12px', paddingTop: '8px', color: '#cbd5e1' }}
                      />
                      <Bar
                        dataKey="revenue"
                        name="Doanh thu đã thanh toán"
                        fill="#06b6d4"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={36}
                      />
                      <Bar
                        dataKey="apparelRevenue"
                        name="Doanh thu đơn áo"
                        fill="#f43f5e"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={36}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </article>

              <article className={panel}>
                <div className="flex items-center justify-between border-b border-blue-400/15 pb-3">
                  <div>
                    <h2 className="text-sm font-semibold normal-case tracking-normal text-slate-100">
                      Báo cáo đơn hàng
                    </h2>
                    <p className="mt-1 text-xs text-slate-400">
                      Phân loại {data.recentOrders.length} đơn gần đây theo trạng thái
                    </p>
                  </div>
                  <Link
                    to="/admin/orders"
                    aria-label="Xem tất cả đơn hàng"
                    className="rounded p-1 text-slate-400 hover:text-cyan-400 focus-visible:outline-cyan-400"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
                {orderStatusCounts.length ? (
                  <div className="mt-5 flex min-h-56 flex-col justify-center gap-4 sm:min-h-64">
                    {orderStatusCounts.map(([status, count]) => (
                      <div key={status}>
                        <div className="mb-1.5 flex justify-between gap-3 text-xs">
                          <span className={statusColor[status] ?? 'text-slate-300'}>
                            {orderStatusLabel[status] || status}
                          </span>
                          <span className="text-slate-400">{count}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded border border-blue-400/10 bg-[#0A1122]">
                          <div
                            className="h-full rounded bg-cyan-400"
                            style={{ width: `${(count / data.recentOrders.length) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-5 flex h-56 items-center justify-center text-sm text-slate-400">
                    Chưa có đơn hàng gần đây.
                  </p>
                )}
              </article>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {kpis.map(({ label, value, hint, icon: Icon, href }) => {
                const card = (
                  <article className="flex h-full min-h-32 flex-col rounded-xl border border-blue-400/15 bg-[#0F172A] p-4 shadow-lg shadow-black/20 sm:p-5">
                    <div className="flex items-start justify-between gap-3 border-b border-blue-400/15 pb-3">
                      <p className="min-w-0 text-sm font-medium leading-snug tracking-normal text-slate-100">
                        {label}
                      </p>
                      <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-cyan-400" />
                    </div>
                    <p className="mt-3 break-words text-xl font-semibold tracking-normal text-cyan-400 sm:text-2xl">
                      {typeof value === 'number' ? value.toLocaleString() : value}
                    </p>
                    <p className="mt-auto pt-3 text-xs leading-relaxed text-slate-400">{hint}</p>
                  </article>
                )
                return href ? (
                  <Link
                    key={label}
                    to={href}
                    className="block rounded-xl transition-all hover:border-cyan-400/50 hover:shadow-cyan-500/10 focus-visible:outline-cyan-400"
                  >
                    {card}
                  </Link>
                ) : (
                  <div key={label}>{card}</div>
                )
              })}
            </div>

            <article className="overflow-hidden rounded-xl border border-blue-400/15 bg-[#0F172A] shadow-lg shadow-black/20">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-400/15 p-4 sm:p-5">
                <div>
                  <h2 className="text-base font-semibold normal-case tracking-normal text-cyan-400">
                    Đơn hàng áo gần đây
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Trạng thái xử lý đơn và thanh toán được theo dõi riêng.
                  </p>
                </div>
                <Link
                  to="/admin/orders"
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300"
                >
                  Tất cả đơn hàng <ArrowUpRight aria-hidden="true" className="inline h-4 w-4" />
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-left text-xs">
                  <thead className="border-b border-blue-400/15 bg-[#162038]/80 text-[10px] font-semibold uppercase tracking-wider text-slate-300">
                    <tr>
                      <th className="px-4 py-2.5">Mã đơn</th>
                      <th className="px-4 py-2.5">Khách hàng</th>
                      <th className="px-4 py-2.5">Tổng tiền</th>
                      <th className="px-4 py-2.5">Trạng thái đơn hàng</th>
                      <th className="px-4 py-2.5">Ngày tạo đơn</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentOrders.map((order) => (
                      <tr
                        key={order._id}
                        className="border-t border-blue-400/10 text-slate-300 transition-colors hover:bg-blue-500/[0.05]"
                      >
                        <td className="whitespace-nowrap px-4 py-2.5 font-medium text-cyan-400">
                          #{order._id.slice(-8).toUpperCase()}
                        </td>
                        <td className="max-w-48 truncate px-4 py-2.5">
                          {order.userId?.fullName || order.userId?.email || '—'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 font-semibold text-cyan-400">
                          {formatVND(order.totalPrice)}
                        </td>
                        <td
                          className={`whitespace-nowrap px-4 py-2.5 font-medium ${
                            statusColor[order.status] ?? 'text-slate-300'
                          }`}
                        >
                          {orderStatusLabel[order.status] || order.status}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-slate-400">
                          {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!data.recentOrders.length && (
                  <p className="p-8 text-center text-sm text-slate-400">Chưa có đơn hàng.</p>
                )}
              </div>
            </article>
          </>
        )
      )}
    </section>
  )
}
