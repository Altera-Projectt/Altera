import { useCallback, useEffect, useState } from 'react'
import { AdminService } from '@/services/admin.api'
import { formatVND } from '@/utils/format'

const paymentStatuses = ['PENDING', 'PAID', 'FAILED', 'CANCELLED', 'EXPIRED']
const paymentMethods = ['COD', 'BANK_TRANSFER', 'MOMO']
type AdminPayment = { _id: string; orderId: string; paymentMethod: string; paymentStatus: string; amount: number; transactionId?: string | null; createdAt: string; order?: { userId?: { fullName?: string; email?: string }; shippingAddress?: { fullName?: string } } | null }
const errorMessage = (error: unknown, fallback: string) => (error as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback

export function AdminPaymentOrdersPage() {
  const [payments, setPayments] = useState<AdminPayment[]>([])
  const [status, setStatus] = useState('')
  const [method, setMethod] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const load = useCallback(() => {
    setLoading(true)
    setError('')
    AdminService.payments({ status: status || undefined, method: method || undefined, limit: 100 })
      .then((response) => setPayments(response.data.data.payments))
      .catch((err: unknown) => setError(errorMessage(err, 'Could not load payments.')))
      .finally(() => setLoading(false))
  }, [status, method])
  useEffect(() => {
    let active = true
    AdminService.payments({ status: status || undefined, method: method || undefined, limit: 100 })
      .then((response) => { if (active) setPayments(response.data.data.payments as AdminPayment[]) })
      .catch((err: unknown) => { if (active) setError(errorMessage(err, 'Could not load payments.')) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [status, method])

  const confirm = async (payment: AdminPayment) => {
    const transactionId = window.prompt('Bank transaction ID (optional):')
    if (transactionId === null) return
    setBusyId(payment.orderId)
    setError('')
    try {
      await AdminService.confirmPayment(payment.orderId, transactionId.trim() || undefined)
      setNotice('Payment confirmed successfully.')
      load()
    } catch (err: unknown) { setError(errorMessage(err, 'Could not confirm payment.')) }
    finally { setBusyId('') }
  }

  const reject = async (payment: AdminPayment) => {
    const reason = window.prompt('Reason for rejecting this payment (optional):')
    if (reason === null) return
    setBusyId(payment.orderId)
    setError('')
    try {
      await AdminService.rejectPayment(payment.orderId, reason.trim() || undefined)
      setNotice('Payment rejected.')
      load()
    } catch (err: unknown) { setError(errorMessage(err, 'Could not reject payment.')) }
    finally { setBusyId('') }
  }

  return <section><h1 className="font-heading text-3xl font-bold">Payments</h1>
    <div className="my-6 flex flex-wrap gap-3"><select aria-label="Filter payment status" value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-lg border px-3 py-2"><option value="">All payment statuses</option>{paymentStatuses.map((value) => <option key={value}>{value}</option>)}</select><select aria-label="Filter payment method" value={method} onChange={(event) => setMethod(event.target.value)} className="rounded-lg border px-3 py-2"><option value="">All payment methods</option>{paymentMethods.map((value) => <option key={value}>{value}</option>)}</select></div>
    {error && <p role="alert" className="mb-3 text-red-600">{error}</p>}{notice && <p role="status" className="mb-3 text-green-700">{notice}</p>}{loading ? <p>Loading payments…</p> : payments.length === 0 ? <p className="rounded-xl border p-8 text-center">No payments found.</p> : <div className="overflow-x-auto rounded-xl border"><table className="w-full text-left text-sm"><thead className="bg-gray-50"><tr>{['Order ID', 'Customer', 'Email', 'Amount', 'Method', 'Payment Status', 'Transaction ID', 'Created', 'Actions'].map((label) => <th className="p-3" key={label}>{label}</th>)}</tr></thead><tbody>{payments.map((payment) => <tr key={payment._id} className="border-t"><td className="p-3">{String(payment.orderId).slice(-8)}</td><td className="p-3">{payment.order?.userId?.fullName || payment.order?.shippingAddress?.fullName || '—'}</td><td className="p-3">{payment.order?.userId?.email || '—'}</td><td className="p-3">{formatVND(payment.amount)}</td><td className="p-3">{payment.paymentMethod}</td><td className="p-3">{payment.paymentStatus}</td><td className="p-3">{payment.transactionId || '—'}</td><td className="p-3">{new Date(payment.createdAt).toLocaleDateString()}</td><td className="p-3">{payment.paymentMethod === 'BANK_TRANSFER' && payment.paymentStatus === 'PENDING' && <div className="flex gap-2"><button disabled={busyId === String(payment.orderId)} onClick={() => confirm(payment)} className="rounded bg-green-700 px-3 py-1 text-white disabled:opacity-50">Confirm</button><button disabled={busyId === String(payment.orderId)} onClick={() => reject(payment)} className="rounded bg-red-700 px-3 py-1 text-white disabled:opacity-50">Reject</button></div>}</td></tr>)}</tbody></table></div>}
  </section>
}
