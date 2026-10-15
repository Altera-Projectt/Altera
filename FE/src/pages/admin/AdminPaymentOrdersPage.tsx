import { useCallback, useEffect, useState } from 'react'
import { AdminService } from '@/services/admin.api'
import { formatVND } from '@/utils/format'

const paymentStatuses = ['PENDING', 'PROCESSING', 'PAID', 'SUCCESS', 'FAILED', 'CANCELLED', 'EXPIRED', 'REFUNDED']
const paymentMethods = ['COD', 'BANK_TRANSFER', 'MOMO']
const paymentStatusLabel: Record<string, string> = { PENDING: 'Chờ thanh toán', PROCESSING: 'Đang xử lý', PAID: 'Đã thanh toán', SUCCESS: 'Thành công', FAILED: 'Thất bại', CANCELLED: 'Đã hủy', EXPIRED: 'Hết hạn', REFUNDED: 'Đã hoàn tiền' }
const paymentMethodLabel: Record<string, string> = { COD: 'Thanh toán khi nhận hàng', BANK_TRANSFER: 'Chuyển khoản', MOMO: 'MoMo' }
type AdminPayment = { _id: string; orderId: string; paymentMethod: string; paymentStatus: string; amount: number; transactionId?: string | null; createdAt: string; order?: { userId?: { fullName?: string; email?: string }; shippingAddress?: { fullName?: string } } | null }
const errorMessage = (error: unknown, fallback: string) => (error as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback

export function AdminPaymentOrdersPage() {
  const [payments, setPayments] = useState<AdminPayment[]>([])
  const [status, setStatus] = useState('')
  const [method, setMethod] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const load = useCallback(() => {
    setLoading(true)
    setError('')
    AdminService.payments({ status: status || undefined, method: method || undefined, page, limit: 20 })
      .then((response) => { setPayments(response.data.data.payments); setTotalPages(response.data.data.pagination.totalPages || 1) })
      .catch((err: unknown) => setError(errorMessage(err, 'Không thể tải danh sách thanh toán.')))
      .finally(() => setLoading(false))
  }, [status, method, page])
  useEffect(() => {
    let active = true
    AdminService.payments({ status: status || undefined, method: method || undefined, page, limit: 20 })
      .then((response) => { if (active) { setPayments(response.data.data.payments as AdminPayment[]); setTotalPages(response.data.data.pagination.totalPages || 1) } })
      .catch((err: unknown) => { if (active) setError(errorMessage(err, 'Không thể tải danh sách thanh toán.')) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [status, method, page])

  const confirm = async (payment: AdminPayment) => {
    const transactionId = window.prompt('Nhập mã tham chiếu giao dịch ngân hàng:')
    if (transactionId === null) return
    if (!transactionId.trim()) { setError('Vui lòng nhập mã tham chiếu giao dịch.'); return }
    setBusyId(payment.orderId)
    setError('')
    try {
      await AdminService.confirmPayment(payment.orderId, transactionId.trim() || undefined)
      setNotice('Đã xác nhận thanh toán.')
      load()
    } catch (err: unknown) { setError(errorMessage(err, 'Không thể xác nhận thanh toán.')) }
    finally { setBusyId('') }
  }

  const reject = async (payment: AdminPayment) => {
    const reason = window.prompt('Nhập lý do từ chối thanh toán:')
    if (reason === null) return
    if (!reason.trim()) { setError('Vui lòng nhập lý do từ chối.'); return }
    setBusyId(payment.orderId)
    setError('')
    try {
      await AdminService.rejectPayment(payment.orderId, reason.trim() || undefined)
      setNotice('Đã từ chối thanh toán.')
      load()
    } catch (err: unknown) { setError(errorMessage(err, 'Không thể từ chối thanh toán.')) }
    finally { setBusyId('') }
  }

  return <section className="mx-auto max-w-[1500px] space-y-6 text-slate-100">
    <div><p className="text-xs font-bold uppercase tracking-[.18em] text-cyan-400">GIAO DỊCH ĐƠN HÀNG</p><h1 className="mt-2 font-heading text-3xl font-bold text-white">Quản lý thanh toán đơn hàng áo</h1><p className="mt-2 text-sm text-slate-400">Theo dõi giao dịch thanh toán cho các đơn đặt áo.</p></div>
    <div className="flex flex-wrap gap-3 rounded-xl border border-blue-400/15 bg-[#0F172A] p-4 shadow-lg shadow-black/20"><select aria-label="Lọc trạng thái thanh toán" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }} className="rounded-lg border border-blue-400/20 bg-[#162038] px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"><option value="" className="bg-[#0F172A] text-white">Tất cả trạng thái thanh toán</option>{paymentStatuses.map((value) => <option key={value} value={value} className="bg-[#0F172A] text-white">{paymentStatusLabel[value]}</option>)}</select><select aria-label="Lọc phương thức thanh toán" value={method} onChange={(event) => { setMethod(event.target.value); setPage(1) }} className="rounded-lg border border-blue-400/20 bg-[#162038] px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"><option value="" className="bg-[#0F172A] text-white">Tất cả phương thức</option>{paymentMethods.map((value) => <option key={value} value={value} className="bg-[#0F172A] text-white">{paymentMethodLabel[value]}</option>)}</select></div>
    {error && <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}{notice && <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">{notice}</p>}{loading ? <p className="text-slate-400">Đang tải giao dịch…</p> : payments.length === 0 ? <p className="rounded-xl border border-blue-400/15 bg-[#0F172A] p-8 text-center text-slate-400">Không tìm thấy giao dịch.</p> : <div className="overflow-hidden rounded-xl border border-blue-400/15 bg-[#0F172A] shadow-lg shadow-black/20"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-[#162038]/80 text-xs uppercase tracking-wider font-semibold text-slate-300 border-b border-blue-400/15"><tr>{['Mã đơn hàng', 'Khách hàng', 'Email', 'Số tiền', 'Phương thức', 'Trạng thái thanh toán', 'Mã giao dịch', 'Ngày tạo', 'Thao tác'].map((label) => <th className="px-4 py-3" key={label}>{label}</th>)}</tr></thead><tbody>{payments.map((payment) => <tr key={payment._id} className="border-t border-blue-400/10 hover:bg-blue-500/[0.05] transition-colors"><td className="px-4 py-3 font-mono text-xs font-semibold text-cyan-400">#{String(payment.orderId).slice(-8).toUpperCase()}</td><td className="px-4 py-3 font-medium text-white">{payment.order?.userId?.fullName || payment.order?.shippingAddress?.fullName || '—'}</td><td className="px-4 py-3 text-slate-300">{payment.order?.userId?.email || '—'}</td><td className="px-4 py-3 font-semibold text-cyan-400">{formatVND(payment.amount)}</td><td className="px-4 py-3 text-slate-300">{paymentMethodLabel[payment.paymentMethod] || payment.paymentMethod}</td><td className="px-4 py-3"><span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${payment.paymentStatus === 'PAID' || payment.paymentStatus === 'SUCCESS' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : payment.paymentStatus === 'FAILED' || payment.paymentStatus === 'CANCELLED' || payment.paymentStatus === 'EXPIRED' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'}`}>{paymentStatusLabel[payment.paymentStatus] || payment.paymentStatus}</span></td><td className="px-4 py-3 font-mono text-xs text-slate-400">{payment.transactionId || '—'}</td><td className="px-4 py-3 text-slate-400">{new Date(payment.createdAt).toLocaleDateString('vi-VN')}</td><td className="px-4 py-3">{payment.paymentMethod === 'BANK_TRANSFER' && payment.paymentStatus === 'PENDING' && <div className="flex gap-2"><button disabled={busyId === String(payment.orderId)} onClick={() => confirm(payment)} className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50 transition">Xác nhận</button><button disabled={busyId === String(payment.orderId)} onClick={() => reject(payment)} className="rounded-lg border border-rose-500/30 bg-[#162038]/60 px-3 py-1 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 disabled:opacity-50 transition">Từ chối</button></div>}</td></tr>)}</tbody></table></div><div className="flex items-center justify-between border-t border-blue-400/15 p-3 text-sm text-slate-400"><span>Trang {page} / {Math.max(totalPages, 1)}</span><div className="flex gap-2"><button disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-blue-400/20 bg-[#162038]/60 text-slate-200 hover:bg-blue-500/20 px-3 py-1.5 text-xs disabled:opacity-40 transition">Trước</button><button disabled={page >= totalPages || loading} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-blue-400/20 bg-[#162038]/60 text-slate-200 hover:bg-blue-500/20 px-3 py-1.5 text-xs disabled:opacity-40 transition">Sau</button></div></div></div>}
  </section>
}
