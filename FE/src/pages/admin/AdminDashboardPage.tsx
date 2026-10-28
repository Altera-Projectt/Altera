import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
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
import { formatVND, formatVNDShort, optimizeCloudinaryUrl } from '@/utils/format'

type RevenueDayItem = {
  _id: string
  label?: string
  revenue: number
  apparelRevenue?: number
  membershipRevenue?: number
  transactions: number
}

type RevenueBreakdown = {
  totalGmv: number
  apparelRevenue: number
  membershipRevenue: number
  marketplaceGrossSales: number
  directStudioRevenue: number
  commissionRate: number
  sellerRoyaltyPayout: number
  platformCommissionFromMarketplace: number
  netPlatformRevenue: number
  leaderboardGrossTotal: number
}

type TopSellerItem = {
  designerId: string
  userId: string | null
  displayName: string
  username: string
  email: string
  avatar: string
  membershipTier: string
  totalDesigns: number
  publishedDesigns: number
  totalLikes: number
  ordersCount: number
  itemsSold: number
  grossSales: number
  sellerEarnings: number
  platformFee: number
  commissionRate: number
  topDesign?: {
    _id: string
    name: string
    thumbnail: string
    price: number
    salesCount: number
  } | null
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
  revenueBreakdown?: RevenueBreakdown
  topSellers?: Array<TopSellerItem>
  revenueByDay: Array<RevenueDayItem>
  revenueChart?: Array<RevenueDayItem>
}

type RevenueChartPoint = {
  key: string
  label: string
  tooltipLabel: string
  revenue: number
  apparelRevenue: number
  membershipRevenue: number
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

const panel =
  'min-w-0 rounded-xl border border-blue-400/15 bg-[#0F172A] p-4 sm:p-5'

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
      { revenue: number; apparelRevenue: number; membershipRevenue: number; transactions: number }
    >()

    for (const item of rawDays) {
      const rev = Number(item.revenue ?? 0)
      const apparel =
        item.apparelRevenue !== undefined
          ? Number(item.apparelRevenue)
          : Math.round(rev * fallbackRatio)
      const membership =
        item.membershipRevenue !== undefined
          ? Number(item.membershipRevenue)
          : Math.max(0, rev - apparel)
      byDate.set(item._id, {
        revenue: rev,
        apparelRevenue: apparel,
        membershipRevenue: membership,
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
          membershipRevenue: 0,
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
            membershipRevenue: 0,
            transactions: 0,
          })
        }
        const bucket = monthMap.get(ym)!
        bucket.revenue += values.revenue
        bucket.apparelRevenue += values.apparelRevenue
        bucket.membershipRevenue += values.membershipRevenue
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
        membershipRevenue: found ? found.membershipRevenue : 0,
        transactions: found ? found.transactions : 0,
      })
    }

    return dailyPoints
  }, [data, days])

  const breakdown = useMemo(() => {
    const rb = data?.revenueBreakdown
    const commissionRate = rb?.commissionRate ?? 0.05
    const commissionPercent = Math.round(commissionRate * 100)
    const platformPercent = 100 - commissionPercent
    const totalGmv = rb?.totalGmv ?? data?.revenue ?? 0
    const apparelRevenue = rb?.apparelRevenue ?? data?.apparelRevenue ?? 0
    const membershipRevenue = rb?.membershipRevenue ?? data?.membershipRevenue ?? 0
    const leaderboardGrossTotal =
      rb?.leaderboardGrossTotal ??
      (data?.topSellers ?? []).reduce((sum, item) => sum + Number(item.grossSales || 0), 0)
    const marketplaceGrossSales =
      rb?.marketplaceGrossSales && rb.marketplaceGrossSales > 0
        ? rb.marketplaceGrossSales
        : leaderboardGrossTotal
    const sellerRoyaltyPayout =
      rb?.sellerRoyaltyPayout && rb.sellerRoyaltyPayout > 0
        ? rb.sellerRoyaltyPayout
        : Math.round(marketplaceGrossSales * commissionRate)
    const platformCommissionFromMarketplace = Math.max(
      0,
      marketplaceGrossSales - sellerRoyaltyPayout
    )
    const directStudioRevenue = Math.max(0, apparelRevenue - (rb?.marketplaceGrossSales ?? 0))
    const netPlatformRevenue =
      totalGmv > 0
        ? Math.max(0, totalGmv - (rb?.sellerRoyaltyPayout ?? 0))
        : platformCommissionFromMarketplace + membershipRevenue

    return {
      commissionRate,
      commissionPercent,
      platformPercent,
      totalGmv,
      apparelRevenue,
      membershipRevenue,
      marketplaceGrossSales,
      sellerRoyaltyPayout,
      platformCommissionFromMarketplace,
      directStudioRevenue,
      netPlatformRevenue,
      leaderboardGrossTotal,
    }
  }, [data])

  const topSellers = data?.topSellers ?? []

  const kpis = data
    ? [
        {
          code: '01',
          label: 'Tổng tài khoản',
          value: data.totalUsers,
          hint: `${data.activeUsers.toLocaleString()} đang hoạt động`,
          href: '/admin/users',
        },
        {
          code: '02',
          label: 'Hồ sơ nhà thiết kế (Sellers)',
          value: data.designerProfiles,
          hint: `${data.totalCustomers.toLocaleString()} tài khoản khách hàng`,
        },
        {
          code: '03',
          label: 'Mẫu thiết kế Marketplace',
          value: data.designs,
          hint: `${data.approvedDesigns.toLocaleString()} đang mở bán · ${data.pendingDesigns.toLocaleString()} chờ duyệt`,
          href: '/admin/designs',
        },
        {
          code: '04',
          label: 'Thanh toán chờ đối soát',
          value: data.pendingPayments,
          hint: `${data.failedPayments.toLocaleString()} giao dịch thất bại`,
          href: '/admin/payments',
        },
        {
          code: '05',
          label: 'Tổng dòng tiền (GMV)',
          value: formatVND(data.revenue),
          hint: `Trong ${rangeLabel} · gồm đơn áo và hội viên`,
        },
        {
          code: '06',
          label: 'Doanh thu đơn hàng áo',
          value: formatVND(data.apparelRevenue),
          hint: 'Thanh toán mua áo Marketplace & Studio 3D',
        },
        {
          code: '07',
          label: 'Doanh thu gói Hội viên VIP',
          value: formatVND(data.membershipRevenue),
          hint: 'Thanh toán nâng cấp gói PREMIUM / PRO',
        },
        {
          code: '08',
          label: 'Giao dịch thành công',
          value: data.paidTransactions,
          hint: `Đã xác nhận thanh toán trong ${rangeLabel}`,
          href: '/admin/payments',
        },
        {
          code: '09',
          label: 'Kho phôi áo (Base Models)',
          value: data.activeProducts,
          hint: 'Mẫu phôi hoạt động cho Studio 3D & AI',
          href: '/admin/products',
        },
      ]
    : []

  return (
    <section className="mx-auto max-w-[1500px] space-y-5 text-slate-100 sm:space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-cyan-400">
            ALTERA · ADMIN CONTROL CENTER
          </p>
          <h1 className="mt-2 text-2xl font-bold normal-case tracking-normal text-slate-100 sm:text-3xl">
            Tổng quan Doanh thu & Bảng xếp hạng Người bán
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Phân tích minh bạch các nguồn thu (Hoa hồng Sàn, Doanh thu Người bán Marketplace, Gói Hội viên VIP) và vinh danh các Creator có doanh số nổi bật.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/admin/payments"
            className="inline-flex items-center rounded-lg border border-cyan-400/30 bg-[#162038] px-3.5 py-2 text-xs font-semibold text-cyan-400 transition-colors hover:bg-blue-600 hover:text-slate-100"
          >
            Đối soát Thanh toán Đơn áo & Hội viên
          </Link>
          <Link
            to="/admin/designs"
            className="inline-flex items-center rounded-lg border border-blue-400/20 bg-[#0A1122] px-3.5 py-2 text-xs font-semibold text-slate-300 transition-colors hover:border-cyan-400/40 hover:text-slate-100"
          >
            Kiểm duyệt Thiết kế ({data?.pendingDesigns ?? 0})
          </Link>
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }, (_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-xl border border-blue-400/10 bg-[#0F172A]/60"
            />
          ))}
        </div>
      ) : (
        data && (
          <>
            {/* ── PHẦN 1: CƠ CẤU NGUỒN THU & PHÂN CHIA HOA HỒNG (REVENUE STREAMS BREAKDOWN) ── */}
            <article className={panel}>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-blue-400/15 pb-4">
                <div>
                  <div className="inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-400">
                    Bóc tách dòng tiền minh bạch
                  </div>
                  <h2 className="mt-2 text-base font-bold normal-case tracking-normal text-slate-100 sm:text-lg">
                    Cơ cấu Nguồn thu Hệ thống & Phân chia Hoa hồng Người bán
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Làm rõ nguồn thu từ <span className="font-semibold text-slate-200">Đơn hàng Áo thun (Marketplace & Studio 3D)</span>, <span className="font-semibold text-cyan-400">Hoa hồng trả cho Người bán ({breakdown.commissionPercent}%)</span>, <span className="font-semibold text-blue-400">Phí Sàn & Sản xuất ({breakdown.platformPercent}%)</span> và <span className="font-semibold text-amber-400">Gói Hội viên VIP (100% về Sàn)</span>.
                  </p>
                </div>
                <div className="rounded-lg border border-blue-400/20 bg-[#0A1122] px-3 py-2 text-right">
                  <p className="text-[11px] font-medium text-slate-400">Tỷ lệ chia sẻ bản quyền Creator</p>
                  <p className="mt-0.5 text-xs font-bold tracking-normal text-cyan-400">
                    Creator {breakdown.commissionPercent}% · Sàn & Sản xuất {breakdown.platformPercent}%
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                {/* Card 1: Thực thu Nền tảng ALTERA */}
                <div className="rounded-xl border border-cyan-400/30 bg-gradient-to-b from-[#162038] to-[#0A1122] p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold tracking-normal text-cyan-400">
                      1. Thực thu Nền tảng ALTERA
                    </span>
                    <span className="rounded-md bg-cyan-400/15 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                      Net Platform
                    </span>
                  </div>
                  <p className="mt-2.5 text-xl font-bold tracking-normal text-slate-100 sm:text-2xl">
                    {formatVND(breakdown.netPlatformRevenue)}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-slate-400">
                    Tổng thu thực tế về ALTERA sau khi trừ hoa hồng bản quyền trả cho Nhà thiết kế.
                  </p>
                  <div className="mt-3 flex items-center justify-between border-t border-blue-400/15 pt-2.5 text-[11px] text-slate-300">
                    <span>Tổng GMV ({rangeLabel}):</span>
                    <span className="font-semibold text-cyan-400">{formatVND(breakdown.totalGmv)}</span>
                  </div>
                </div>

                {/* Card 2: Doanh số Người bán trên Marketplace */}
                <div className="rounded-xl border border-blue-400/20 bg-[#0A1122] p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold tracking-normal text-slate-100">
                      2. Doanh số của Người bán (Sellers)
                    </span>
                    <span className="rounded-md bg-blue-500/15 px-2 py-0.5 text-[10px] font-bold text-blue-300">
                      Gross Sales
                    </span>
                  </div>
                  <p className="mt-2.5 text-xl font-bold tracking-normal text-blue-400 sm:text-2xl">
                    {formatVND(breakdown.marketplaceGrossSales)}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-slate-400">
                    Tổng giá trị đơn hàng áo thun bán ra từ các mẫu thiết kế của Người dùng / Creator trên sàn.
                  </p>
                  <div className="mt-3 flex items-center justify-between border-t border-blue-400/15 pt-2.5 text-[11px] text-slate-300">
                    <span>Phí Sàn & Sản xuất ({breakdown.platformPercent}%):</span>
                    <span className="font-semibold text-slate-100">
                      {formatVND(breakdown.platformCommissionFromMarketplace)}
                    </span>
                  </div>
                </div>

                {/* Card 3: Tiền Hoa hồng trả cho Người bán */}
                <div className="rounded-xl border border-blue-400/20 bg-[#0A1122] p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold tracking-normal text-slate-100">
                      3. Hoa hồng Người bán thực nhận
                    </span>
                    <span className="rounded-md bg-cyan-400/15 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                      {breakdown.commissionPercent}% Royalty
                    </span>
                  </div>
                  <p className="mt-2.5 text-xl font-bold tracking-normal text-cyan-400 sm:text-2xl">
                    {formatVND(breakdown.sellerRoyaltyPayout)}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-slate-400">
                    Tiền bản quyền thiết kế ({breakdown.commissionPercent}% trên mỗi áo bán thành công) cộng trực tiếp vào ví Creator.
                  </p>
                  <div className="mt-3 flex items-center justify-between border-t border-blue-400/15 pt-2.5 text-[11px] text-slate-300">
                    <span>Đơn Studio 3D trực tiếp:</span>
                    <span className="font-semibold text-slate-100">
                      {formatVND(breakdown.directStudioRevenue)}
                    </span>
                  </div>
                </div>

                {/* Card 4: Doanh thu Gói Hội viên VIP */}
                <div className="rounded-xl border border-blue-400/20 bg-[#0A1122] p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold tracking-normal text-slate-100">
                      4. Doanh thu Gói Hội viên VIP
                    </span>
                    <span className="rounded-md bg-amber-400/15 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                      VIP 100%
                    </span>
                  </div>
                  <p className="mt-2.5 text-xl font-bold tracking-normal text-amber-400 sm:text-2xl">
                    {formatVND(breakdown.membershipRevenue)}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-slate-400">
                    Doanh thu bán gói <span className="text-slate-200">PREMIUM (59.000 ₫)</span> & <span className="text-slate-200">PRO STUDIO (99.000 ₫)</span> — 100% thuộc về Sàn.
                  </p>
                  <div className="mt-3 flex items-center justify-between border-t border-blue-400/15 pt-2.5 text-[11px] text-slate-300">
                    <span>Tỷ lệ biên lợi nhuận:</span>
                    <span className="font-semibold text-amber-400">100% Doanh thu dịch vụ số</span>
                  </div>
                </div>
              </div>
            </article>

            {/* ── PHẦN 2: BIỂU ĐỒ DOANH SỐ THEO THỜI GIAN ── */}
            <article className={panel}>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-400/15 pb-3">
                <div>
                  <h2 className="text-sm font-semibold normal-case tracking-normal text-slate-100">
                    Biểu đồ biến động doanh thu ({rangeLabel} gần nhất)
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Tổng thanh toán: <span className="font-semibold text-cyan-400">{formatVND(data.revenue)}</span> · Đơn áo: <span className="font-semibold text-blue-400">{formatVND(data.apparelRevenue)}</span> · Hội viên VIP: <span className="font-semibold text-amber-400">{formatVND(data.membershipRevenue)}</span>
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

              <div className="mt-4 h-72 w-full sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={revenueChartData}
                    margin={{ top: 10, right: 8, left: 0, bottom: 4 }}
                    barGap={days === 30 ? 3 : 6}
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
                      minTickGap={days === 30 ? 12 : 6}
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
                      name="Tổng doanh thu đã thanh toán"
                      fill="#22d3ee"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={38}
                    />
                    <Bar
                      dataKey="apparelRevenue"
                      name="Doanh thu đơn áo (Marketplace & Studio)"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={38}
                    />
                    <Bar
                      dataKey="membershipRevenue"
                      name="Doanh thu gói Hội viên VIP"
                      fill="#f59e0b"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={38}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>

            {/* ── PHẦN 3: BẢNG THỐNG KÊ DOANH THU NGƯỜI BÁN NỔI BẬT (TOP SELLERS LEADERBOARD) ── */}
            <article className={panel}>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-blue-400/15 pb-4">
                <div>
                  <div className="inline-flex items-center rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
                    Bảng vàng Creator & Seller tiêu biểu
                  </div>
                  <h2 className="mt-2 text-base font-bold normal-case tracking-normal text-slate-100 sm:text-lg">
                    Bảng thống kê Doanh thu Người dùng & Nhà thiết kế nổi bật
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Xếp hạng các người bán có doanh số thương mại cao nhất trên Marketplace để vinh danh, trao thưởng và theo dõi hoa hồng.
                  </p>
                </div>
                <Link
                  to="/marketplace"
                  className="inline-flex items-center rounded-lg border border-blue-400/25 bg-[#0A1122] px-3 py-1.5 text-xs font-semibold text-cyan-400 transition-colors hover:border-cyan-400/50 hover:bg-[#162038]"
                >
                  Xem Sàn Marketplace
                </Link>
              </div>

              {topSellers.length === 0 ? (
                <div className="mt-4 rounded-xl border border-blue-400/15 bg-[#0A1122] p-8 text-center">
                  <p className="text-sm font-medium text-slate-300">
                    Chưa có dữ liệu nhà thiết kế trên Marketplace.
                  </p>
                </div>
              ) : (
                <>
                  {/* Top 3 Podium Highlight Cards */}
                  <div className="mt-4 grid gap-3.5 md:grid-cols-3">
                    {topSellers.slice(0, 3).map((seller, index) => {
                      const rank = index + 1
                      const badgeStyles =
                        rank === 1
                          ? 'border-amber-400/40 bg-gradient-to-b from-amber-500/15 via-[#162038] to-[#0A1122]'
                          : rank === 2
                            ? 'border-cyan-400/35 bg-gradient-to-b from-cyan-500/10 via-[#162038] to-[#0A1122]'
                            : 'border-blue-400/25 bg-gradient-to-b from-blue-500/10 via-[#162038] to-[#0A1122]'
                      const rankBadge =
                        rank === 1
                          ? 'bg-amber-400 text-slate-950'
                          : rank === 2
                            ? 'bg-cyan-400 text-slate-950'
                            : 'bg-blue-500 text-slate-100'

                      return (
                        <div
                          key={seller.designerId}
                          className={`relative rounded-xl border p-4 transition-all ${badgeStyles}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-cyan-400/30 bg-[#060B16] text-sm font-bold text-cyan-400">
                                {seller.avatar ? (
                                  <img
                                    src={optimizeCloudinaryUrl(seller.avatar, 96)}
                                    alt={seller.displayName}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  seller.displayName.slice(0, 2).toUpperCase()
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <Link
                                    to={`/designer/${seller.username}`}
                                    className="truncate text-sm font-bold tracking-normal text-slate-100 hover:text-cyan-400"
                                  >
                                    {seller.displayName}
                                  </Link>
                                  {seller.membershipTier !== 'FREE' && (
                                    <span className="shrink-0 rounded bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                                      {seller.membershipTier}
                                    </span>
                                  )}
                                </div>
                                <p className="truncate text-xs text-slate-400">
                                  @{seller.username} · {seller.publishedDesigns} mẫu đang bán
                                </p>
                              </div>
                            </div>
                            <span
                              className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-extrabold ${rankBadge}`}
                            >
                              TOP {rank}
                            </span>
                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-2.5 rounded-lg border border-blue-400/15 bg-[#060B16]/70 p-3">
                            <div>
                              <p className="text-[11px] text-slate-400">Tổng doanh số bán</p>
                              <p className="mt-0.5 text-base font-bold tracking-normal text-cyan-400">
                                {formatVND(seller.grossSales)}
                              </p>
                            </div>
                            <div>
                              <p className="text-[11px] text-slate-400">
                                Hoa hồng nhận ({Math.round(seller.commissionRate * 100)}%)
                              </p>
                              <p className="mt-0.5 text-base font-bold tracking-normal text-amber-300">
                                {formatVND(seller.sellerEarnings)}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                            <span>
                              Đã bán: <strong className="text-slate-200">{seller.itemsSold} áo</strong> ({seller.ordersCount} đơn)
                            </span>
                            <span>
                              Phí sàn: <strong className="text-slate-200">{formatVND(seller.platformFee)}</strong>
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Full Leaderboard Table — Compact Frame with Fixed Height & No Horizontal Scroll */}
                  <div className="mt-4 max-h-[360px] overflow-y-auto rounded-xl border border-blue-400/15 bg-[#0A1122]">
                    <table className="w-full border-collapse text-left text-xs sm:text-sm">
                      <thead className="sticky top-0 z-10 border-b border-blue-400/15 bg-[#162038] text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                        <tr>
                          <th className="w-12 px-3 py-2.5 text-center">Hạng</th>
                          <th className="px-3 py-2.5">Creator / Người bán</th>
                          <th className="hidden md:table-cell px-3 py-2.5">Thiết kế tiêu biểu</th>
                          <th className="px-3 py-2.5 text-right">Đã bán</th>
                          <th className="px-3 py-2.5 text-right">Doanh số &amp; Hoa hồng (5%)</th>
                          <th className="px-3 py-2.5 text-right">Về Sàn (95%)</th>
                          <th className="w-24 px-3 py-2.5 text-right">Tỷ trọng</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-blue-400/10">
                        {topSellers.map((seller, idx) => {
                          const rank = idx + 1
                          const sharePercent =
                            breakdown.leaderboardGrossTotal > 0
                              ? Math.round((seller.grossSales / breakdown.leaderboardGrossTotal) * 100)
                              : 0

                          return (
                            <tr
                              key={seller.designerId}
                              className="transition-colors hover:bg-[#162038]/50"
                            >
                              <td className="px-3 py-2.5 text-center">
                                <span
                                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                                    rank === 1
                                      ? 'bg-amber-400 text-slate-950'
                                      : rank === 2
                                        ? 'bg-cyan-400 text-slate-950'
                                        : rank === 3
                                          ? 'bg-blue-500 text-slate-100'
                                          : 'border border-blue-400/20 bg-[#0F172A] text-slate-300'
                                  }`}
                                >
                                  #{rank}
                                </span>
                              </td>
                              <td className="px-3 py-2.5">
                                <div className="flex items-center gap-2.5">
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-cyan-400/25 bg-[#0F172A] text-xs font-bold text-cyan-400">
                                    {seller.avatar ? (
                                      <img
                                        src={optimizeCloudinaryUrl(seller.avatar, 80)}
                                        alt={seller.displayName}
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      seller.displayName.slice(0, 2).toUpperCase()
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <Link
                                        to={`/designer/${seller.username}`}
                                        className="truncate font-semibold tracking-normal text-slate-100 hover:text-cyan-400"
                                      >
                                        {seller.displayName}
                                      </Link>
                                      {seller.membershipTier !== 'FREE' && (
                                        <span className="shrink-0 rounded bg-amber-400/20 px-1 py-0.2 text-[9px] font-bold text-amber-300">
                                          {seller.membershipTier}
                                        </span>
                                      )}
                                    </div>
                                    <p className="truncate text-[11px] text-slate-400">
                                      @{seller.username} · {seller.publishedDesigns} mẫu
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="hidden md:table-cell px-3 py-2.5">
                                {seller.topDesign ? (
                                  <Link
                                    to={`/marketplace/${seller.topDesign._id}`}
                                    className="group flex items-center gap-2"
                                  >
                                    {seller.topDesign.thumbnail ? (
                                      <img
                                        src={optimizeCloudinaryUrl(seller.topDesign.thumbnail, 80)}
                                        alt={seller.topDesign.name}
                                        className="h-7 w-7 shrink-0 rounded-md border border-blue-400/20 bg-[#0F172A] object-cover"
                                      />
                                    ) : (
                                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-blue-400/20 bg-[#0F172A] text-[9px] font-bold text-cyan-400">
                                        3D
                                      </div>
                                    )}
                                    <p className="max-w-[140px] truncate text-xs text-slate-300 group-hover:text-cyan-400">
                                      {seller.topDesign.name}
                                    </p>
                                  </Link>
                                ) : (
                                  <span className="text-[11px] text-slate-500">Chưa đăng</span>
                                )}
                              </td>
                              <td className="px-3 py-2.5 text-right">
                                <span className="font-semibold text-slate-100">
                                  {seller.itemsSold} áo
                                </span>
                                <p className="text-[10px] text-slate-400">
                                  {seller.ordersCount} đơn
                                </p>
                              </td>
                              <td className="px-3 py-2.5 text-right">
                                <span className="font-bold text-cyan-400">
                                  {formatVND(seller.grossSales)}
                                </span>
                                <p className="text-[11px] font-medium text-amber-300">
                                  +{formatVND(seller.sellerEarnings)} hoa hồng
                                </p>
                              </td>
                              <td className="px-3 py-2.5 text-right font-medium text-slate-300">
                                {formatVND(seller.platformFee)}
                              </td>
                              <td className="w-24 px-3 py-2.5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <div className="h-1.5 w-12 overflow-hidden rounded-full bg-[#060B16]">
                                    <div
                                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                                      style={{ width: `${Math.max(sharePercent, seller.grossSales > 0 ? 8 : 0)}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-semibold text-slate-300">
                                    {sharePercent}%
                                  </span>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </article>

            {/* ── PHẦN 4: CHỈ SỐ VẬN HÀNH HỆ THỐNG (KPI CARDS - KHÔNG DÙNG ICON) ── */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {kpis.map(({ code, label, value, hint, href }) => {
                const card = (
                  <article className="flex h-full min-h-32 flex-col rounded-xl border border-blue-400/15 bg-[#0F172A] p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3 border-b border-blue-400/15 pb-3">
                      <p className="min-w-0 text-sm font-medium leading-snug tracking-normal text-slate-100">
                        {label}
                      </p>
                      <span className="shrink-0 rounded bg-[#162038] px-2 py-0.5 font-mono text-[11px] font-bold text-cyan-400">
                        {code}
                      </span>
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
                    className="block rounded-xl transition-all hover:border-cyan-400/50 focus-visible:outline-cyan-400"
                  >
                    {card}
                  </Link>
                ) : (
                  <div key={label}>{card}</div>
                )
              })}
            </div>
          </>
        )
      )}
    </section>
  )
}
