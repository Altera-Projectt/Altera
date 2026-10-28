import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Copy, Crown, QrCode, ShieldCheck, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { MembershipService, type MembershipPlan } from '@/services/membership.api'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { formatVND } from '@/utils/format'

const methods = [
  {
    id: 'BANK_TRANSFER',
    label: 'Chuyển khoản Ngân hàng (VietQR)',
    desc: 'Quét mã QR MBBank kích hoạt gói VIP nhanh chóng',
  },
  {
    id: 'MOMO',
    label: 'Ví điện tử MoMo',
    desc: 'Thanh toán qua cổng MoMo QR',
  },
] as const

export function MembershipCheckoutPage() {
  const [search] = useSearchParams()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [code, setCode] = useState(search.get('plan') || 'PREMIUM')
  const [method, setMethod] = useState<(typeof methods)[number]['id']>('BANK_TRANSFER')
  const [fullName, setFullName] = useState(user?.fullName || '')
  const [email, setEmail] = useState(user?.email || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [transferResult, setTransferResult] = useState<{
    paymentReference?: string
    bankName?: string
    accountNumber?: string
    accountName?: string
    amount?: number
    paymentContent?: string
    qrCodeUrl?: string
  } | null>(null)

  const selected = useMemo(() => plans.find((p) => p.code === code), [plans, code])

  useEffect(() => {
    MembershipService.plans()
      .then((r) => setPlans(r.data.data.plans))
      .catch(() => setError('Không thể tải danh sách gói hội viên.'))
  }, [])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selected) return
    setBusy(true)
    setError('')
    try {
      const response = await MembershipService.checkout({
        planCode: selected.code,
        paymentMethod: method,
        fullName,
        email,
        phone,
      })
      const data = response.data.data
      if (data.free) {
        toast.success('Đã kích hoạt gói miễn phí thành công!')
        navigate('/membership')
        return
      }
      if (data.paymentUrl) {
        window.location.assign(data.paymentUrl)
        return
      }
      if (data.transfer) {
        setTransferResult({
          paymentReference: data.paymentReference,
          ...data.transfer,
        })
        toast.success('Đã tạo mã QR thanh toán gói Hội viên VIP!')
        return
      }
      navigate(`/payment/pending?reference=${encodeURIComponent(data.paymentReference || '')}`, {
        state: data.transfer,
      })
    } catch (e) {
      setError(
        (e as { response?: { data?: { message?: string } } }).response?.data?.message ||
          'Không thể tạo giao dịch. Vui lòng thử lại.'
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#060B16] text-slate-100 py-12 px-5">
      <form
        onSubmit={submit}
        className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.45fr_1fr]"
      >
        <div className="space-y-6">
          <header>
            <Link
              to="/membership"
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-cyan-400 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Quay lại trang Gói Hội viên
            </Link>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-[#162038] px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-cyan-400">
              <Crown className="h-3.5 w-3.5" />
              Thanh toán Dịch vụ Số · Gói Hội Viên VIP
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-normal text-slate-100 sm:text-4xl">
              Thanh toán Gói Hội viên ALTERA
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Mở khóa giới hạn tạo ảnh AI Thiết kế Áo, Tách nền thông minh và quyền đăng bán tác phẩm trên Marketplace.
            </p>
          </header>

          <section className="rounded-2xl border border-blue-400/15 bg-[#0F172A] p-6">
            <h2 className="mb-4 text-base font-bold tracking-normal text-slate-100">
              1. Chọn gói thành viên
            </h2>
            <div className="grid gap-3.5 sm:grid-cols-3">
              {plans.map((plan) => {
                const active = code === plan.code
                return (
                  <button
                    type="button"
                    key={plan._id}
                    onClick={() => {
                      setCode(plan.code)
                      setTransferResult(null)
                    }}
                    className={`rounded-xl border p-4 text-left transition-all ${
                      active
                        ? 'border-cyan-400 bg-[#162038] shadow-lg shadow-cyan-500/10'
                        : 'border-blue-400/15 bg-[#0A1122] hover:border-cyan-400/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold tracking-normal text-slate-100">{plan.name}</span>
                      {active && <CheckCircle2 className="h-4 w-4 text-cyan-400" />}
                    </div>
                    <p className="mt-2 text-base font-extrabold text-cyan-400">
                      {plan.price ? `${formatVND(plan.price)} / 30 ngày` : 'Miễn phí'}
                    </p>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-blue-400/15 bg-[#0F172A] p-6">
            <h2 className="mb-4 text-base font-bold tracking-normal text-slate-100">
              2. Thông tin tài khoản nhận quyền lợi VIP
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-semibold text-slate-300">
                Họ và tên *
                <input
                  required
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-blue-400/20 bg-[#0A1122] px-3.5 py-2.5 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
                />
              </label>
              <label className="text-xs font-semibold text-slate-300">
                Email kích hoạt *
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-blue-400/20 bg-[#0A1122] px-3.5 py-2.5 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
                />
              </label>
              <label className="text-xs font-semibold text-slate-300 sm:col-span-2">
                Số điện thoại liên hệ *
                <input
                  required
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-blue-400/20 bg-[#0A1122] px-3.5 py-2.5 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
                />
              </label>
            </div>
          </section>

          {Boolean(selected?.price) && (
            <section className="rounded-2xl border border-blue-400/15 bg-[#0F172A] p-6">
              <h2 className="mb-4 text-base font-bold tracking-normal text-slate-100">
                3. Phương thức thanh toán gói Hội viên
              </h2>
              <div className="grid gap-3.5 sm:grid-cols-2">
                {methods.map((m) => {
                  const active = method === m.id
                  return (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => setMethod(m.id)}
                      className={`rounded-xl border p-4 text-left transition-all ${
                        active
                          ? 'border-cyan-400 bg-[#162038] shadow-lg shadow-cyan-500/10'
                          : 'border-blue-400/15 bg-[#0A1122] hover:border-cyan-400/40'
                      }`}
                    >
                      <p className="text-sm font-bold tracking-normal text-slate-100">{m.label}</p>
                      <p className="mt-1 text-xs text-slate-400">{m.desc}</p>
                    </button>
                  )
                })}
              </div>
            </section>
          )}

          {transferResult && (
            <section className="rounded-2xl border border-cyan-400/40 bg-[#0F172A] p-6 shadow-xl">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-4">
                <QrCode className="h-4 w-4" />
                Quét mã VietQR để hoàn tất nâng cấp Gói Hội viên
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {transferResult.qrCodeUrl && (
                  <div className="rounded-xl bg-white p-2.5 shrink-0">
                    <img
                      src={transferResult.qrCodeUrl}
                      alt="Mã VietQR nâng cấp Hội viên"
                      className="h-48 w-48 object-contain"
                    />
                  </div>
                )}
                <div className="space-y-2.5 text-sm flex-1">
                  <p className="text-slate-300">
                    Ngân hàng: <strong className="text-slate-100">{transferResult.bankName}</strong>
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-300">Số tài khoản:</span>
                    <strong className="font-mono text-cyan-400">{transferResult.accountNumber}</strong>
                    <button
                      type="button"
                      onClick={() => {
                        void navigator.clipboard.writeText(transferResult.accountNumber || '')
                        toast.success('Đã sao chép số tài khoản')
                      }}
                      className="text-xs text-slate-400 hover:text-slate-100"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-slate-300">
                    Chủ tài khoản: <strong className="text-slate-100">{transferResult.accountName}</strong>
                  </p>
                  <p className="text-slate-300">
                    Số tiền: <strong className="text-cyan-400">{formatVND(transferResult.amount || 0)}</strong>
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-300">Nội dung CK:</span>
                    <strong className="font-mono text-amber-300">{transferResult.paymentContent}</strong>
                    <button
                      type="button"
                      onClick={() => {
                        void navigator.clipboard.writeText(transferResult.paymentContent || '')
                        toast.success('Đã sao chép nội dung chuyển khoản')
                      }}
                      className="text-xs text-slate-400 hover:text-slate-100"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        navigate(
                          `/payment/pending?reference=${encodeURIComponent(
                            transferResult.paymentReference || ''
                          )}`,
                          { state: transferResult }
                        )
                      }
                    >
                      Theo dõi trạng thái kích hoạt tự động →
                    </Button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300"
            >
              {error}
            </p>
          )}
        </div>

        <aside className="h-fit rounded-2xl border border-blue-400/20 bg-[#0F172A] p-6 lg:sticky lg:top-24">
          <div className="flex items-center justify-between border-b border-blue-400/15 pb-4">
            <h2 className="text-base font-bold tracking-normal text-slate-100">
              Tóm tắt Gói Hội viên
            </h2>
            <span className="rounded bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
              VIP Subscription
            </span>
          </div>
          {selected && (
            <>
              <div className="mt-5 rounded-xl border border-cyan-400/20 bg-[#0A1122] p-4">
                <div className="flex items-center gap-2 text-cyan-400">
                  <Sparkles className="h-4 w-4" />
                  <h3 className="text-lg font-bold tracking-normal text-slate-100">
                    {selected.name}
                  </h3>
                </div>
                <p className="mt-1 text-xl font-extrabold text-cyan-400">
                  {selected.price ? `${formatVND(selected.price)} / 30 ngày` : 'Miễn phí'}
                </p>
              </div>

              <ul className="my-5 space-y-2.5 text-xs text-slate-300">
                {selected.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-400" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="border-t border-blue-400/15 py-3.5 text-xs text-slate-400 space-y-1">
                <p>
                  Ngày kích hoạt:{' '}
                  <strong className="text-slate-200">
                    {new Date().toLocaleDateString('vi-VN')}
                  </strong>
                </p>
                <p>
                  Thời hạn hiệu lực:{' '}
                  <strong className="text-slate-200">
                    {selected.billingCycle === 'FREE'
                      ? 'Không giới hạn'
                      : `${(selected as { durationDays?: number }).durationDays || 30} ngày`}
                  </strong>
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-blue-400/15 py-4">
                <span className="text-sm font-semibold text-slate-300">Tổng thanh toán</span>
                <span className="text-2xl font-extrabold text-cyan-400">
                  {formatVND(selected.price)}
                </span>
              </div>
            </>
          )}
          <Button
            type="submit"
            loading={busy}
            className="w-full bg-blue-600 hover:bg-blue-500 text-slate-100 font-bold"
            disabled={!selected}
          >
            {selected?.price ? 'Tạo mã QR & Thanh toán ngay' : 'Kích hoạt gói miễn phí'}
          </Button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
            Kích hoạt tự động ngay sau khi xác nhận chuyển khoản
          </p>
        </aside>
      </form>
    </div>
  )
}
