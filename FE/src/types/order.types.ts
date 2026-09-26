export interface OrderItem {
  productId: string
  quantity: number
  cartItemId?: string
}

export interface ShippingAddress {
  fullName?: string
  phone?: string
  address?: string
  street?: string
  city: string
  province?: string
  country?: string
}

export type PaymentMethod = 'COD' | 'BANK_TRANSFER' | 'MOMO'

export interface CreateOrderPayload {
  items: OrderItem[]
  shippingAddress: ShippingAddress
  paymentMethod?: PaymentMethod
  checkoutKey?: string
}

export interface Order {
  _id: string
  // Cho phép backend mở rộng sau này
  [key: string]: any
}

export interface TransferDetails {
  bankCode: string
  bankName: string
  accountNumber: string
  accountName: string
  amount: number
  orderId: string
  paymentContent: string
  paymentReference: string
  qrCodeUrl: string
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'EXPIRED'
}

export interface OrdersResponse {
  orders: Order[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}
