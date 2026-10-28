import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { CheckoutPage } from './CheckoutPage'
import { OrderService } from '@/services/order.api'
import { CartService } from '@/services/cart.api'
import '@testing-library/jest-dom'

jest.mock('@/services/order.api', () => ({
  OrderService: {
    createOrder: jest.fn(),
  },
}))

jest.mock('@/services/cart.api', () => ({
  CartService: {
    clearCart: jest.fn(),
  },
}))

const mockCartStore = {
  cart: {
    items: [
      {
        _id: 'cart-item-1',
        productId: { _id: 'p1', name: 'Mẫu áo cũ 1', price: 200000, imageUrl: '' },
        quantity: 2,
        price: 200000,
      },
      {
        _id: 'cart-item-2',
        productId: { _id: 'p2', name: 'Mẫu áo cũ 2', price: 150000, imageUrl: '' },
        quantity: 1,
        price: 150000,
      },
    ],
    totalPrice: 550000,
  },
  fetchCart: jest.fn(),
}

jest.mock('@/store/cartStore', () => ({
  useCartStore: () => mockCartStore,
}))

describe('CheckoutPage - Buy Now & Bank Transfer Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('Flow Buy Now: renders ONLY buyNowItem in summary ignoring existing cart items', () => {
    const buyNowItem = {
      _id: 'buy-now-123',
      productId: {
        _id: 'fpt-product-id',
        name: 'Áo FPT Tech',
        imageUrl: '',
        price: 379000,
      },
      quantity: 1,
      price: 379000,
    }

    render(
      <MemoryRouter initialEntries={[{ pathname: '/checkout', state: { buyNowItem } }]}>
        <Routes>
          <Route path="/checkout" element={<CheckoutPage />} />
        </Routes>
      </MemoryRouter>
    )

    // Verify ONLY the Buy Now product is listed in the summary
    expect(screen.getByText('Áo FPT Tech')).toBeInTheDocument()
    expect(screen.queryByText('Mẫu áo cũ 1')).not.toBeInTheDocument()
    expect(screen.queryByText('Mẫu áo cũ 2')).not.toBeInTheDocument()

    // Total should be 379.000 ₫, NOT 550.000 ₫ + 379.000 ₫
    const totalElements = screen.getAllByText(/379\.000/i)
    expect(totalElements.length).toBeGreaterThan(0)
  })

  it('Flow Bank Transfer: toggles admin bank instructions and VietQR message', () => {
    render(
      <MemoryRouter initialEntries={['/checkout']}>
        <Routes>
          <Route path="/checkout" element={<CheckoutPage />} />
        </Routes>
      </MemoryRouter>
    )

    // Initially COD is selected
    expect(screen.queryByText(/Hướng dẫn chuyển khoản ngân hàng/i)).not.toBeInTheDocument()

    // Click "Chuyển khoản ngân hàng"
    const bankTransferBtn = screen.getByRole('button', { name: /Chuyển khoản ngân hàng/i })
    fireEvent.click(bankTransferBtn)

    // Bank transfer card should now be visible
    expect(screen.getByText(/Hướng dẫn chuyển khoản ngân hàng/i)).toBeInTheDocument()
    expect(screen.getByText(/0384431663/i)).toBeInTheDocument()
    expect(screen.getByText(/HUYNH ANH KHOI/i)).toBeInTheDocument()
    expect(screen.getByText(/Mã QR chuyển khoản tự động kèm đúng số tiền/i)).toBeInTheDocument()
  })

  it('Flow Buy Now Submission: sends isBuyNow: true and DOES NOT call clearCart', async () => {
    const buyNowItem = {
      _id: 'buy-now-999',
      productId: {
        _id: 'isolated-prod',
        name: 'Áo Mua Riêng',
        imageUrl: '',
        price: 350000,
      },
      quantity: 1,
      price: 350000,
    }

    ;(OrderService.createOrder as jest.Mock).mockResolvedValue({
      data: {
        data: {
          _id: 'order-12345678',
        },
      },
    })

    render(
      <MemoryRouter initialEntries={[{ pathname: '/checkout', state: { buyNowItem } }]}>
        <Routes>
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders/success/:id" element={<div>Order Success Page</div>} />
        </Routes>
      </MemoryRouter>
    )

    // Fill form
    fireEvent.change(screen.getByLabelText(/Họ và tên/i), { target: { value: 'Nguyễn Văn Test' } })
    fireEvent.change(screen.getByLabelText(/Số điện thoại/i), { target: { value: '0901234567' } })
    fireEvent.change(screen.getByLabelText(/Địa chỉ giao hàng/i), { target: { value: '123 Đường Số 1, Q1' } })

    // Click submit
    const submitBtn = screen.getByRole('button', { name: /Đặt hàng ngay/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(OrderService.createOrder).toHaveBeenCalledTimes(1)
    })

    const payload = (OrderService.createOrder as jest.Mock).mock.calls[0][0]
    expect(payload.isBuyNow).toBe(true)
    expect(payload.items.length).toBe(1)
    expect(payload.items[0].productId).toBe('isolated-prod')

    // CRITICAL: CartService.clearCart must NOT be called in Buy Now mode
    expect(CartService.clearCart).not.toHaveBeenCalled()
  })
})
