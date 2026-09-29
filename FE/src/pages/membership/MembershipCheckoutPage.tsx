import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

type PlanType = 'BASIC' | 'PREMIUM' | 'PRO STUDIO'

const PLAN_DETAILS = {
  'BASIC': {
    price: 0,
    features: [
      '5 gợi ý từ AI mỗi ngày',
      '2 thiết kế tùy chỉnh mỗi ngày',
      'Công cụ tùy chỉnh cơ bản',
      'Lưu tối đa 5 dự án',
    ]
  },
  'PREMIUM': {
    price: 59000,
    features: [
      'Không giới hạn gợi ý phong cách',
      'Sáng tạo không giới hạn',
      'Ưu tiên dịch vụ may đo',
      'Lưu trữ dự án không giới hạn',
    ]
  },
  'PRO STUDIO': {
    price: 99000,
    features: [
      'Tính năng AI nâng cao',
      'Ưu tiên tiến độ sản xuất',
      'Đăng tải thiết kế lên sàn thương mại',
      'Hỗ trợ kỹ thuật ưu tiên',
    ]
  }
}

export function MembershipCheckoutPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(
    (location.state?.plan as PlanType) || 'PREMIUM'
  )
  const [isSuccess, setIsSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  // Form states
  const [name, setName] = useState(user?.fullName || '')
  const [email, setEmail] = useState(user?.email || '')
  const [studio, setStudio] = useState('')

  const planDetails = PLAN_DETAILS[selectedPlan]
  const currentPrice = planDetails.price

  // Generate mock transaction ID
  const [transactionId] = useState(`ALT${Math.floor(1000 + Math.random() * 9000)}`)

  // VietQR URL with print template to show account info
  const qrUrl = `https://img.vietqr.io/image/MB-0384431663-print.png?amount=${currentPrice}&addInfo=${transactionId}&accountName=HUYNH%20ANH%20KHOI`

  const handlePayment = () => {
    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      setIsSuccess(true)
    }, 2000)
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white text-black font-body pt-32 pb-24 flex flex-col items-center">
        <div className="w-full max-w-[var(--spacing-contentMax)] mx-auto px-6 text-center">
          <h1 className="font-heading text-5xl md:text-6xl text-[#0011FF] font-black uppercase tracking-tight mb-16">
            THANH TOÁN THÀNH CÔNG
          </h1>

          <div className="flex justify-center mb-12">
            <CheckCircle2 className="w-48 h-48 text-gray-300 stroke-1" />
          </div>

          <h2 className="text-3xl font-bold mb-4 tracking-tight">
            Tài khoản của bạn đã được nâng cấp!
          </h2>
          <p className="text-xl text-gray-500 font-light mb-12">
            Bắt đầu trải nghiệm những tính năng đặc biệt của ALTERA nào.
          </p>

          <h3 className="text-2xl font-bold text-[#0011FF] uppercase mb-16">
            ALTERA XIN CẢM ƠN QUÝ KHÁCH!
          </h3>

          <button 
            onClick={() => navigate('/design')}
            className="px-12 py-4 bg-[#0011FF] text-white font-bold rounded-xl uppercase tracking-widest hover:bg-blue-800 transition-colors"
          >
            Bắt đầu thiết kế
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-black font-body pt-32 pb-24">
      <div className="w-full max-w-[var(--spacing-contentMax)] mx-auto px-6">
        
        <h1 className="font-heading text-5xl md:text-6xl text-[#0011FF] font-black uppercase tracking-tight mb-12 leading-none">
          MEMBERSHIP <br /> CHECKOUT
        </h1>

        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Left Column (Forms & Payment) */}
          <div className="flex-1 space-y-12">
            
            {/* Section: Plan Selection */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-black/5">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-700 uppercase tracking-widest text-sm">CHỌN GÓI THÀNH VIÊN</h3>
                <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-full text-xs font-bold">
                  <span className="px-4 py-1.5 bg-[#0011FF] text-white rounded-full">HÀNG THÁNG</span>
                  <span className="px-4 py-1.5 text-gray-500">HÀNG NĂM</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {(['BASIC', 'PREMIUM', 'PRO STUDIO'] as PlanType[]).map((plan) => (
                  <div 
                    key={plan}
                    onClick={() => setSelectedPlan(plan)}
                    className={`cursor-pointer rounded-xl border-2 p-6 flex flex-col relative transition-all ${
                      selectedPlan === plan 
                        ? 'border-[#0011FF] bg-blue-50/20' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {plan === 'PREMIUM' && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0011FF] text-white text-[9px] font-bold px-3 py-1 rounded-full whitespace-nowrap">
                        PHỔ BIẾN NHẤT
                      </span>
                    )}
                    {plan === 'PRO STUDIO' && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black text-white text-[9px] font-bold px-3 py-1 rounded-full whitespace-nowrap">
                        PRO PLAN
                      </span>
                    )}
                    <h4 className="font-black text-lg mb-1">{plan}</h4>
                    <p className="text-[10px] text-gray-500 mb-6 flex-1">
                      {plan === 'BASIC' ? 'Trải nghiệm' : plan === 'PREMIUM' ? 'Sáng tạo chuyên sâu' : 'Quy trình Sản xuất'}
                    </p>
                    <div className="mt-auto">
                      {PLAN_DETAILS[plan].price === 0 ? (
                        <span className="text-xl font-medium">Miễn Phí</span>
                      ) : (
                        <div className="flex flex-col">
                          <span className="text-2xl font-medium text-[#0011FF] leading-none">
                            {PLAN_DETAILS[plan].price.toLocaleString('vi-VN')}
                          </span>
                          <span className="text-2xl font-medium text-[#0011FF] leading-tight">VNĐ</span>
                          <span className="text-xs text-gray-500 mt-1">/ tháng</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section: Identification */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-black/5">
              <h3 className="font-bold text-gray-700 uppercase tracking-widest text-sm mb-6 flex items-center gap-2">
                <span className="text-[#0011FF] text-lg">👤</span> THÔNG TIN ĐỊNH DANH
              </h3>
              
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-2">HỌ VÀ TÊN <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#0011FF]" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-2">ĐỊA CHỈ EMAIL <span className="text-red-500">*</span></label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#0011FF]" 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-2">TÊN STUDIO / NHÀ MỐT <span className="text-gray-400 font-normal">(tùy chọn)</span></label>
                <input 
                  type="text" 
                  value={studio}
                  onChange={(e) => setStudio(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#0011FF]" 
                />
              </div>
            </div>

            {/* Section: Payment Method */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-black/5">
              <h3 className="font-bold text-gray-700 uppercase tracking-widest text-sm mb-6 flex items-center gap-2">
                <span className="text-[#0011FF] text-lg">💳</span> PHƯƠNG THỨC THANH TOÁN
              </h3>
              
              <div className="grid grid-cols-3 gap-4 mb-8">
                <button className="py-4 border border-gray-200 rounded-xl text-[11px] font-bold text-gray-400 uppercase bg-gray-50 cursor-not-allowed">
                  THẺ QUỐC TẾ (VISA/MC)
                </button>
                <button className="py-4 border border-gray-200 rounded-xl text-[11px] font-bold text-gray-400 uppercase bg-gray-50 cursor-not-allowed">
                  VÍ MOMO
                </button>
                <button className="py-4 border-2 border-[#0011FF] rounded-xl text-[11px] font-bold text-[#0011FF] uppercase bg-white">
                  CHUYỂN KHOẢN
                </button>
              </div>

              {currentPrice > 0 ? (
                <div className="flex gap-8">
                  <div className="w-[200px] h-[200px] bg-gray-100 rounded-xl flex flex-col items-center justify-center p-2 border border-gray-200">
                    <img src={qrUrl} alt="VietQR" className="w-full h-full object-contain mix-blend-multiply" />
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-4">
                      <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">NGÂN HÀNG THỤ HƯỞNG:</span>
                        <span className="text-sm font-bold text-[#0011FF]">MBBank</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">CHỦ TÀI KHOẢN:</span>
                        <span className="text-sm font-bold">HUYNH ANH KHOI</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">SỐ TIỀN THANH TOÁN:</span>
                        <span className="text-sm font-bold text-[#0011FF]">{currentPrice.toLocaleString('vi-VN')} VNĐ</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">NỘI DUNG CHUYỂN KHOẢN:</span>
                        <span className="text-sm font-bold">{transactionId}</span>
                      </div>
                    </div>

                    <div className="mt-4 space-y-1 text-[11px] text-gray-500 font-medium">
                      <p>1. Mở ứng dụng <span className="font-bold text-gray-700">Ngân hàng</span> trên điện thoại thông minh của bạn.</p>
                      <p>2. Chọn <span className="font-bold text-gray-700">"Quét Mã"</span> và hướng camera vào mã QR bên cạnh.</p>
                      <p>3. Kiểm tra số tiền {currentPrice.toLocaleString('vi-VN')} VNĐ và bấm <span className="font-bold text-gray-700">"Xác nhận"</span>.</p>
                    </div>

                    <button 
                      onClick={handlePayment}
                      disabled={loading}
                      className="w-full mt-6 py-4 bg-[#0011FF] text-white text-sm font-bold rounded-xl uppercase tracking-widest hover:bg-blue-800 transition-colors disabled:opacity-70 flex justify-center items-center"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        'THANH TOÁN NGAY'
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-6 font-medium">Gói BASIC hoàn toàn miễn phí, bạn không cần thanh toán.</p>
                  <button 
                    onClick={handlePayment}
                    disabled={loading}
                    className="w-full max-w-md mx-auto py-4 bg-[#0011FF] text-white text-sm font-bold rounded-xl uppercase tracking-widest hover:bg-blue-800 transition-colors disabled:opacity-70 flex justify-center items-center"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      'XÁC NHẬN ĐĂNG KÝ MIỄN PHÍ'
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Discount Code */}
            <div className="flex gap-4">
              <input 
                type="text" 
                placeholder="MÃ KHUYẾN MÃI / PHIẾU ĐẶC QUYỀN" 
                className="flex-1 bg-white border border-gray-200 rounded-lg px-4 py-3 text-xs outline-none focus:border-[#0011FF] uppercase font-bold" 
              />
              <button className="px-8 bg-gray-800 text-white text-[11px] font-bold rounded-lg uppercase tracking-widest hover:bg-black transition-colors">
                ÁP DỤNG
              </button>
            </div>

          </div>

          {/* Right Column (Order Summary) */}
          <div className="w-full lg:w-[380px]">
            <div className="bg-white p-8 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-black/5 sticky top-32">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-700 uppercase tracking-widest text-sm">TỔNG KẾT ĐƠN HÀNG</h3>
                <span className="text-[9px] font-bold bg-gray-100 text-gray-500 px-3 py-1 rounded-full">THANH TOÁN HÀNG THÁNG</span>
              </div>

              <h4 className="font-heading font-black text-3xl mb-1">{selectedPlan}</h4>
              <p className="text-[10px] text-gray-500 mb-6">
                {selectedPlan === 'BASIC' ? 'Trải nghiệm' : selectedPlan === 'PREMIUM' ? 'Sáng tạo chuyên sâu' : 'Quy trình Sản xuất'}
              </p>

              <div className="flex flex-col mb-8">
                <span className="text-3xl font-medium text-[#0011FF] leading-none">
                  {currentPrice.toLocaleString('vi-VN')}
                </span>
                <span className="text-3xl font-medium text-[#0011FF] leading-tight mb-2">VNĐ</span>
                <span className="text-xs text-gray-500">/ tháng</span>
              </div>

              <p className="text-xs text-gray-600 mb-4 leading-relaxed font-medium">
                {selectedPlan === 'BASIC' 
                  ? 'Bắt đầu hành trình thời trang của bạn với các tính năng cơ bản.' 
                  : selectedPlan === 'PREMIUM'
                    ? 'Trọn bộ tính năng cần thiết để định hình phong cách và sáng tạo không giới hạn.'
                    : 'Toàn quyền sử dụng các công cụ mạnh mẽ nhất dành cho nhà sáng tạo chuyên nghiệp.'
                }
              </p>

              <ul className="space-y-3 mb-8">
                {planDetails.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start text-[11px] text-gray-600 font-medium">
                    <span className="mr-2 text-black">✓</span> {feature}
                  </li>
                ))}
              </ul>

              <div className="border-t border-gray-200 pt-6 space-y-3 mb-6">
                <div className="flex justify-between text-[11px] font-medium text-gray-500">
                  <span>Tạm tính</span>
                  <span className="text-black">{currentPrice.toLocaleString('vi-VN')} VNĐ</span>
                </div>
                <div className="flex justify-between text-[11px] font-medium text-gray-500">
                  <span>Ưu đãi Studio / Mã giảm</span>
                  <span className="text-black">-0 VNĐ</span>
                </div>
                <div className="flex justify-between text-[11px] font-medium text-gray-500">
                  <span>Thuế GTGT (10%)</span>
                  <span className="text-black">Đã bao gồm</span>
                </div>
              </div>

              <div className="flex justify-between items-end border-t border-gray-200 pt-6">
                <span className="text-[11px] font-bold uppercase tracking-widest w-24">TỔNG TIỀN THANH TOÁN</span>
                <div className="flex flex-col text-right">
                  <span className="text-3xl font-medium text-[#0011FF] leading-none">{currentPrice.toLocaleString('vi-VN')}</span>
                  <span className="text-3xl font-medium text-[#0011FF] leading-tight">VNĐ</span>
                </div>
              </div>
              <p className="text-[8px] text-right text-gray-400 mt-4">Tự động gia hạn hàng tháng, hủy bất kỳ lúc nào</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
