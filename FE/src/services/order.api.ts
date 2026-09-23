import api from '@/utils/axios'
import type { ApiResponse } from '@/types/api.types'
import type {
  Order,
  OrdersResponse,
  CreateOrderPayload,
} from '@/types/order.types'

export const OrderService = {
  getMyOrders: (page = 1, limit = 10) =>
    api.get<ApiResponse<OrdersResponse>>('/orders/my-orders', {
      params: { page, limit },
    }),

  getOrder: (id: string) =>
    api.get<ApiResponse<{ order: Order }>>(`/orders/${id}`),

  createOrder: (payload: CreateOrderPayload) =>
  api.post<ApiResponse<{ order: Order; payment: { paymentReference: string; paymentMethod: string; paymentStatus: string; transfer: import('@/types/order.types').TransferDetails | null } }>>('/orders', payload),
}

export const PaymentService = {
  status: (orderId: string) => api.get<ApiResponse<{ orderId: string; amount: number; paymentMethod: string; paymentStatus: string; paymentReference: string; transactionId: string | null; failureReason: string | null; transfer: import('@/types/order.types').TransferDetails | null }>>(`/payments/${orderId}/status`),
  createMomo: (orderId: string) => api.post<ApiResponse<{ paymentUrl: string; paymentReference: string }>>(`/payments/${orderId}/momo`),
  retryBank: (orderId: string) => api.post<ApiResponse<import('@/types/order.types').TransferDetails>>(`/payments/${orderId}/bank/retry`),
}
