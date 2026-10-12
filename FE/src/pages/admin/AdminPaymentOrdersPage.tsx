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

  return <section><h1 className="font-heading text-3xl font-bold">Quản lý thanh toán đơn hàng áo</h1><p className="mt-2 text-sm text-neutral-500">Theo dõi giao dịch thanh toán cho các đơn đặt áo.</p>
    <div className="my-6 flex flex-wrap gap-3"><select aria-label="Lọc trạng thái thanh toán" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }} className="rounded-lg border px-3 py-2"><option value="">Tất cả trạng thái thanh toán</option>{paymentStatuses.map((value) => <option key={value} value={value}>{paymentStatusLabel[value]}</option>)}</select><select aria-label="Lọc phương thức thanh toán" value={method} onChange={(event) => { setMethod(event.target.value); setPage(1) }} className="rounded-lg border px-3 py-2"><option value="">Tất cả phương thức</option>{paymentMethods.map((value) => <option key={value} value={value}>{paymentMethodLabel[value]}</option>)}</select></div>
    {error && <p role="alert" className="mb-3 text-red-600">{error}</p>}{notice && <p role="status" className="mb-3 text-green-700">{notice}</p>}{loading ? <p>Đang tải giao dịch…</p> : payments.length === 0 ? <p className="rounded-xl border p-8 text-center">Không tìm thấy giao dịch.</p> : <div className="overflow-x-auto rounded-xl border"><table className="w-full text-left text-sm"><thead className="bg-gray-50"><tr>{['Mã đơn hàng', 'Khách hàng', 'Email', 'Số tiền', 'Phương thức', 'Trạng thái thanh toán', 'Mã giao dịch', 'Ngày tạo', 'Thao tác'].map((label) => <th className="p-3" key={label}>{label}</th>)}</tr></thead><tbody>{payments.map((payment) => <tr key={payment._id} className="border-t"><td className="p-3">{String(payment.orderId).slice(-8)}</td><td className="p-3">{payment.order?.userId?.fullName || payment.order?.shippingAddress?.fullName || '—'}</td><td className="p-3">{payment.order?.userId?.email || '—'}</td><td className="p-3">{formatVND(payment.amount)}</td><td className="p-3">{paymentMethodLabel[payment.paymentMethod] || payment.paymentMethod}</td><td className="p-3">{paymentStatusLabel[payment.paymentStatus] || payment.paymentStatus}</td><td className="p-3">{payment.transactionId || '—'}</td><td className="p-3">{new Date(payment.createdAt).toLocaleDateString('vi-VN')}</td><td className="p-3">{payment.paymentMethod === 'BANK_TRANSFER' && payment.paymentStatus === 'PENDING' && <div className="flex gap-2"><button disabled={busyId === String(payment.orderId)} onClick={() => confirm(payment)} className="rounded bg-green-700 px-3 py-1 text-white disabled:opacity-50">Xác nhận</button><button disabled={busyId === String(payment.orderId)} onClick={() => reject(payment)} className="rounded bg-red-700 px-3 py-1 text-white disabled:opacity-50">Từ chối</button></div>}</td></tr>)}</tbody></table><div className="flex items-center justify-between border-t p-3 text-sm"><span>Trang {page} / {Math.max(totalPages, 1)}</span><div className="flex gap-2"><button disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)} className="rounded border px-3 py-1 disabled:opacity-40">Trước</button><button disabled={page >= totalPages || loading} onClick={() => setPage((current) => current + 1)} className="rounded border px-3 py-1 disabled:opacity-40">Sau</button></div></div></div>}
  </section>
}
