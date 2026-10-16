import { useCallback, useEffect, useState } from 'react'
import { AdminService } from '@/services/admin.api'
import { formatVND } from '@/utils/format'

const paymentStatuses = ['PENDING', 'PROCESSING', 'PAID', 'SUCCESS', 'FAILED', 'CANCELLED', 'EXPIRED', 'REFUNDED']
const paymentMethods = ['COD', 'BANK_TRANSFER', 'MOMO']
const paymentStatusLabel: Record<string, string> = {
  PENDING: 'Chờ thanh toán',
  PROCESSING: 'Đang xử lý',
  PAID: 'Đã thanh toán',
  SUCCESS: 'Thành công',
  FAILED: 'Thất bại',
  CANCELLED: 'Đã hủy',
  EXPIRED: 'Hết hạn',
  REFUNDED: 'Đã hoàn tiền',
}
const paymentMethodLabel: Record<string, string> = {
  COD: 'Thanh toán khi nhận hàng',
  BANK_TRANSFER: 'Chuyển khoản',
  MOMO: 'MoMo',
}

type AdminPayment = {
  _id: string
  orderId?: string | null
  membershipOrderId?: string | null
  membershipPlanId?: { name: string; code: string } | null
  userId?: { _id?: string; fullName?: string; email?: string } | null
  paymentMethod: string
  paymentStatus: string
  amount: number
  paymentReference?: string
  providerOrderId?: string | null
  transactionId?: string | null
  createdAt: string
  order?: {
    _id?: string
    userId?: { fullName?: string; email?: string }
    shippingAddress?: { fullName?: string }
  } | null
}

const errorMessage = (error: unknown, fallback: string) =>
  (error as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback

export function AdminPaymentOrdersPage() {
  const [payments, setPayments] = useState<AdminPayment[]>([])
  const [status, setStatus] = useState('')
  const [method, setMethod] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    AdminService.payments({
      status: status || undefined,
      method: method || undefined,
      search: search.trim() || undefined,
      page,
      limit: 20,
    })
      .then((response) => {
        setPayments(response.data.data.payments as AdminPayment[])
        setTotalPages(response.data.data.pagination.totalPages || 1)
      })
      .catch((err: unknown) => setError(errorMessage(err, 'Không thể tải danh sách thanh toán.')))
      .finally(() => setLoading(false))
  }, [status, method, search, page])

  useEffect(() => {
    let active = true
    AdminService.payments({
      status: status || undefined,
      method: method || undefined,
      search: search.trim() || undefined,
      page,
      limit: 20,
    })
      .then((response) => {
        if (active) {
          setPayments(response.data.data.payments as AdminPayment[])
          setTotalPages(response.data.data.pagination.totalPages || 1)
        }
      })
      .catch((err: unknown) => {
        if (active) setError(errorMessage(err, 'Không thể tải danh sách thanh toán.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [status, method, search, page])

  const confirm = async (payment: AdminPayment) => {
    if (!payment.orderId) return
    const transactionId = window.prompt('Nhập mã tham chiếu giao dịch ngân hàng:')
    if (transactionId === null) return
    if (!transactionId.trim()) {
      setError('Vui lòng nhập mã tham chiếu giao dịch.')
      return
    }
    setBusyId(payment.orderId)
    setError('')
    try {
      await AdminService.confirmPayment(payment.orderId, transactionId.trim() || undefined)
      setNotice('Đã xác nhận thanh toán.')
      load()
    } catch (err: unknown) {
      setError(errorMessage(err, 'Không thể xác nhận thanh toán.'))
    } finally {
      setBusyId('')
    }
  }

  const reject = async (payment: AdminPayment) => {
    if (!payment.orderId) return
    const reason = window.prompt('Nhập lý do từ chối thanh toán:')
    if (reason === null) return
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do từ chối.')
      return
    }
    setBusyId(payment.orderId)
    setError('')
    try {
      await AdminService.rejectPayment(payment.orderId, reason.trim() || undefined)
      setNotice('Đã từ chối thanh toán.')
      load()
    } catch (err: unknown) {
      setError(errorMessage(err, 'Không thể từ chối thanh toán.'))
    } finally {
      setBusyId('')
    }
  }

  return (
    <section className="mx-auto max-w-[1500px] space-y-6 text-slate-100">
      <div>
        <p className="text-xs font-bold uppercase tracking-[.18em] text-cyan-400">GIAO DỊCH ĐƠN HÀNG</p>
        <h1 className="mt-2 font-heading text-3xl font-bold text-white">Quản lý thanh toán</h1>
        <p className="mt-2 text-sm text-slate-400">Theo dõi và quản lý các giao dịch thanh toán đơn hàng & gói dịch vụ.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-blue-400/15 bg-[#0F172A] p-4 shadow-lg shadow-black/20">
        <input
          type="text"
          placeholder="Tìm theo mã đơn, mã GD, khách hàng, email..."
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setPage(1)
          }}
          className="min-w-[280px] flex-1 rounded-lg border border-blue-400/20 bg-[#162038] px-3 py-2 text-sm text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none"
        />
        <select
          aria-label="Lọc trạng thái thanh toán"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value)
            setPage(1)
          }}
          className="rounded-lg border border-blue-400/20 bg-[#162038] px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
        >
          <option value="" className="bg-[#0F172A] text-white">Tất cả trạng thái thanh toán</option>
          {paymentStatuses.map((value) => (
            <option key={value} value={value} className="bg-[#0F172A] text-white">
              {paymentStatusLabel[value]}
            </option>
          ))}
        </select>
        <select
          aria-label="Lọc phương thức thanh toán"
          value={method}
          onChange={(event) => {
            setMethod(event.target.value)
            setPage(1)
          }}
          className="rounded-lg border border-blue-400/20 bg-[#162038] px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
        >
          <option value="" className="bg-[#0F172A] text-white">Tất cả phương thức</option>
          {paymentMethods.map((value) => (
            <option key={value} value={value} className="bg-[#0F172A] text-white">
              {paymentMethodLabel[value]}
            </option>
          ))}
        </select>
      </div>

      {error && <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}
      {notice && <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">{notice}</p>}

      {loading ? (
        <p className="text-slate-400">Đang tải giao dịch…</p>
      ) : payments.length === 0 ? (
        <p className="rounded-xl border border-blue-400/15 bg-[#0F172A] p-8 text-center text-slate-400">Không tìm thấy giao dịch.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-blue-400/15 bg-[#0F172A] shadow-lg shadow-black/20">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-blue-400/15 bg-[#162038]/80 text-xs font-semibold uppercase tracking-wider text-slate-300">
                <tr>
                  {['Mã đơn hàng', 'Khách hàng', 'Email', 'Số tiền', 'Phương thức', 'Trạng thái thanh toán', 'Mã giao dịch', 'Ngày tạo', 'Thao tác'].map((label) => (
                    <th className="px-4 py-3" key={label}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => {
                  const customerName =
                    payment.order?.shippingAddress?.fullName ||
                    payment.order?.userId?.fullName ||
                    payment.userId?.fullName ||
                    '—'
                  const customerEmail =
                    payment.order?.userId?.email ||
                    payment.userId?.email ||
                    '—'
                  const txCode =
                    payment.transactionId ||
                    payment.providerOrderId ||
                    payment.paymentReference ||
                    '—'

                  return (
                    <tr key={payment._id} className="border-t border-blue-400/10 transition-colors hover:bg-blue-500/[0.05]">
                      {/* Mã đơn hàng */}
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-cyan-400">
                        {payment.orderId ? (
                          <span>#{String(payment.orderId).slice(-8).toUpperCase()}</span>
                        ) : payment.membershipPlanId?.name ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="rounded bg-cyan-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300 border border-cyan-500/30">
                              Hội viên
                            </span>
                            <span className="text-slate-200">{payment.membershipPlanId.name}</span>
                          </span>
                        ) : payment.membershipOrderId ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="rounded bg-cyan-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300 border border-cyan-500/30">
                              Hội viên
                            </span>
                            <span className="text-slate-300">#{String(payment.membershipOrderId).slice(-6).toUpperCase()}</span>
                          </span>
                        ) : payment.paymentReference ? (
                          <span className="text-slate-300">#{payment.paymentReference}</span>
                        ) : (
                          <span>#{String(payment._id).slice(-8).toUpperCase()}</span>
                        )}
                      </td>

                      {/* Khách hàng */}
                      <td className="px-4 py-3 font-medium text-white">
                        {customerName}
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3 text-slate-300">
                        {customerEmail}
                      </td>

                      {/* Số tiền */}
                      <td className="px-4 py-3 font-semibold text-cyan-400">
                        {formatVND(payment.amount)}
                      </td>

                      {/* Phương thức */}
                      <td className="px-4 py-3 text-slate-300">
                        {paymentMethodLabel[payment.paymentMethod] || payment.paymentMethod}
                      </td>

                      {/* Trạng thái thanh toán */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
                            payment.paymentStatus === 'PAID' || payment.paymentStatus === 'SUCCESS'
                              ? 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-400'
                              : payment.paymentStatus === 'FAILED' || payment.paymentStatus === 'CANCELLED' || payment.paymentStatus === 'EXPIRED'
                              ? 'border border-rose-500/30 bg-rose-500/15 text-rose-400'
                              : 'border border-amber-500/30 bg-amber-500/15 text-amber-400'
                          }`}
                        >
                          {paymentStatusLabel[payment.paymentStatus] || payment.paymentStatus}
                        </span>
                      </td>

                      {/* Mã giao dịch */}
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">
                        {txCode}
                      </td>

                      {/* Ngày tạo */}
                      <td className="px-4 py-3 text-slate-400">
                        {new Date(payment.createdAt).toLocaleDateString('vi-VN')}
                      </td>

                      {/* Thao tác */}
                      <td className="px-4 py-3">
                        {payment.orderId && payment.paymentMethod === 'BANK_TRANSFER' && payment.paymentStatus === 'PENDING' && (
                          <div className="flex gap-2">
                            <button
                              disabled={busyId === String(payment.orderId)}
                              onClick={() => confirm(payment)}
                              className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
                            >
                              Xác nhận
                            </button>
                            <button
                              disabled={busyId === String(payment.orderId)}
                              onClick={() => reject(payment)}
                              className="rounded-lg border border-rose-500/30 bg-[#162038]/60 px-3 py-1 text-xs font-semibold text-rose-400 transition hover:bg-rose-500/20 disabled:opacity-50"
                            >
                              Từ chối
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-blue-400/15 p-3 text-sm text-slate-400">
            <span>Trang {page} / {Math.max(totalPages, 1)}</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1 || loading}
                onClick={() => setPage((current) => current - 1)}
                className="rounded-lg border border-blue-400/20 bg-[#162038]/60 px-3 py-1.5 text-xs text-slate-200 transition hover:bg-blue-500/20 disabled:opacity-40"
              >
                Trước
              </button>
              <button
                disabled={page >= totalPages || loading}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-lg border border-blue-400/20 bg-[#162038]/60 px-3 py-1.5 text-xs text-slate-200 transition hover:bg-blue-500/20 disabled:opacity-40"
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

