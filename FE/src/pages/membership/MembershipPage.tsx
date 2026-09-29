import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

import homepage2 from '@/assets/homepage2.jpg'

export function MembershipPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  const faqs = [
    { q: "Làm thế nào để chuyển đổi từ bản thiết kế sang trang phục thực tế?", a: "Mỗi thiết kế tạo bởi ALTERA sẽ tự động xuất file kỹ thuật số chuẩn xác. Thành viên Premium và Pro có thể bấm 'May đo ngay' để gửi yêu cầu trực tiếp tới xưởng may đối tác của chúng mình và sẽ được hoàn thiện sớm." },
    { q: "Bản quyền sở hữu trí tuệ đối với các thiết kế thuộc về ai?", a: "Mọi thiết kế do bạn sáng tạo thông qua nền tảng ALTERA đều thuộc 100% quyền sở hữu thương mại của bạn. Chúng tôi cam kết bảo mật bản vẽ độc quyền và không tái phân phối cho bên thứ ba." },
    { q: "Tôi có thể hủy gói hoặc thay đổi chu kỳ thanh toán không?", a: "Có. Bạn có thể nâng cấp, hạ cấp hoặc hủy gói bất kỳ lúc nào ngay trong phần Cài đặt tài khoản mà không phát sinh thêm bất kỳ chi phí ẩn nào." }
  ];

  const handleDotClick = (index: number) => {
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.clientWidth;
      scrollRef.current.scrollTo({
        left: index * cardWidth,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen bg-white text-black overflow-hidden font-body selection:bg-electric-blue selection:text-white pt-24">
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 1 — MEMBERSHIP HERO & SLIDER
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative min-h-[90vh] bg-black text-white py-24 flex items-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img src={homepage2} alt="Altera Membership Background" className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent"></div>
        </div>

        <div className="max-w-[var(--spacing-contentMax)] mx-auto w-full relative z-10 flex flex-col lg:flex-row justify-between items-center px-6 gap-12">
          {/* Left Text Content */}
          <div className="w-full lg:w-[50%]">
            <h2 className="text-[clamp(2.5rem,5vw,4rem)] font-heading font-black mb-6 leading-[1.1] tracking-tight">
              Trải nghiệm Trọn vẹn <br />
              Tiện ích cùng ALTERA
            </h2>
            <div className="w-24 h-1 bg-white mb-6"></div>
            <p className="text-lg font-medium mb-10 text-gray-300 max-w-md leading-relaxed">
              Khai phá toàn bộ sức mạnh của ALTERA. Đặc quyền sử dụng các công cụ thiết kế cao cấp, nhận gợi ý thông minh hơn từ AI và sở hữu các bộ sưu tập thời trang giới hạn dành riêng cho thành viên.
            </p>
            <ul className="space-y-4">
              {[
                'Gợi ý phong cách từ AI không giới hạn',
                'Sáng tạo trang phục không giới hạn',
                'Kho chất liệu vải cao cấp',
                'Ưu tiên dịch vụ may đo',
                'Lưu trữ thiết kế không giới hạn',
                'Trải nghiệm sớm các tính năng mới'
              ].map((item, i) => (
                <li key={i} className="flex items-center text-gray-200 text-[15px] md:text-base font-medium">
                  <span className="mr-3 font-bold text-lg">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Right Cards Slider - EXACTLY 1 CARD VISIBLE AT A TIME */}
          <div className="w-full lg:w-[45%] flex relative justify-center">
            {/* The single card container that acts as a window */}
            <div className="relative w-full max-w-[380px] h-[600px] rounded-[24px] overflow-hidden shadow-2xl bg-white">
              
              {/* Horizontal Scroll Container inside the card window */}
              <div 
                ref={scrollRef}
                className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none h-full w-full" 
                style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                
                {/* Card 1: FREE */}
                <div className="min-w-full w-full bg-white text-black p-8 flex flex-col justify-between snap-center border-[3px] border-[#0011FF] rounded-[24px] shrink-0 h-full relative">
                  <div className="flex flex-col items-center text-center">
                    <div className="bg-[#0011FF] text-white text-[11px] font-bold px-6 py-1.5 rounded-full uppercase tracking-widest mb-6">Free Plan</div>
                    <h3 className="text-[#0011FF] text-xl font-black font-heading tracking-widest mb-2">BASIC</h3>
                    <div className="text-[#0011FF] text-6xl font-black font-heading mb-6 tracking-tighter">FREE</div>
                    <p className="text-[13px] text-gray-600 mb-8 font-medium px-2 leading-relaxed h-[60px]">
                      Trải nghiệm tính năng định hình phong cách bằng AI và bắt đầu tạo ra những thiết kế đầu tiên.
                    </p>
                    <ul className="w-full space-y-3 mb-8 text-[13px] font-medium text-left flex-1">
                      <li className="flex items-start leading-snug"><span className="mr-2 text-[#0011FF] font-bold">✓</span> 5 gợi ý từ AI mỗi ngày</li>
                      <li className="flex items-start leading-snug"><span className="mr-2 text-[#0011FF] font-bold">✓</span> 2 thiết kế tùy chỉnh mỗi ngày</li>
                      <li className="flex items-start leading-snug"><span className="mr-2 text-[#0011FF] font-bold">✓</span> Công cụ tùy chỉnh cơ bản</li>
                      <li className="flex items-start leading-snug"><span className="mr-2 text-[#0011FF] font-bold">✓</span> Lưu tối đa 5 dự án</li>
                    </ul>
                  </div>
                  <div>
                    <button onClick={() => navigate('/auth/register')} className="w-full py-3.5 bg-[#0011FF] text-white text-sm font-bold rounded-xl uppercase tracking-widest hover:bg-blue-800 transition-colors">
                      GET STARTED
                    </button>
                    <div className="flex justify-center gap-1.5 mt-6 cursor-pointer pb-2">
                      <div onClick={() => handleDotClick(0)} className="w-5 h-1.5 rounded-full bg-[#0011FF] transition-all"></div>
                      <div onClick={() => handleDotClick(1)} className="w-1.5 h-1.5 rounded-full bg-[#0011FF]/30 transition-all hover:bg-[#0011FF]/50"></div>
                      <div onClick={() => handleDotClick(2)} className="w-1.5 h-1.5 rounded-full bg-[#0011FF]/30 transition-all hover:bg-[#0011FF]/50"></div>
                    </div>
                  </div>
                </div>

                {/* Card 2: PREMIUM */}
                <div className="min-w-full w-full bg-white text-black p-8 flex flex-col justify-between snap-center border-[3px] border-[#00C8FF] rounded-[24px] shrink-0 h-full relative">
                  <div className="flex flex-col items-center text-center">
                    <div className="bg-[#0011FF] text-white text-[11px] font-bold px-6 py-1.5 rounded-full uppercase tracking-widest mb-6">Most Popular</div>
                    <h3 className="text-[#0011FF] text-xl font-black font-heading tracking-widest mb-2">PREMIUM</h3>
                    <div className="text-[#0011FF] text-5xl font-black font-heading mb-6 tracking-tighter flex items-end justify-center">59k<span className="text-xl pb-1.5 tracking-normal">/Tháng</span></div>
                    <p className="text-[13px] text-gray-600 mb-8 font-medium px-2 leading-relaxed h-[60px]">
                      Trọn bộ tính năng cần thiết để định hình phong cách và sáng tạo không giới hạn.
                    </p>
                    <ul className="w-full space-y-3 mb-8 text-[13px] font-medium text-left flex-1">
                      <li className="flex items-start leading-snug"><span className="mr-2 text-[#0011FF] font-bold">✓</span> Không giới hạn gợi ý phong cách</li>
                      <li className="flex items-start leading-snug"><span className="mr-2 text-[#0011FF] font-bold">✓</span> Sáng tạo không giới hạn</li>
                      <li className="flex items-start leading-snug"><span className="mr-2 text-[#0011FF] font-bold">✓</span> Ưu tiên dịch vụ may đo</li>
                      <li className="flex items-start leading-snug"><span className="mr-2 text-[#0011FF] font-bold">✓</span> Lưu trữ dự án không giới hạn</li>
                    </ul>
                  </div>
                  <div>
                    <button onClick={() => navigate('/membership/checkout', { state: { plan: 'PREMIUM', price: 59000 } })} className="w-full py-3.5 bg-[#0011FF] text-white text-sm font-bold rounded-xl uppercase tracking-widest hover:bg-blue-800 transition-colors">
                      UPGRADE NOW
                    </button>
                    <div className="flex justify-center gap-1.5 mt-6 cursor-pointer pb-2">
                      <div onClick={() => handleDotClick(0)} className="w-1.5 h-1.5 rounded-full bg-[#0011FF]/30 transition-all hover:bg-[#0011FF]/50"></div>
                      <div onClick={() => handleDotClick(1)} className="w-5 h-1.5 rounded-full bg-[#0011FF] transition-all"></div>
                      <div onClick={() => handleDotClick(2)} className="w-1.5 h-1.5 rounded-full bg-[#0011FF]/30 transition-all hover:bg-[#0011FF]/50"></div>
                    </div>
                  </div>
                </div>

                {/* Card 3: PRO */}
                <div className="min-w-full w-full bg-white text-black p-8 flex flex-col justify-between snap-center border-[3px] border-[#00C8FF] rounded-[24px] shrink-0 h-full relative">
                  <div className="flex flex-col items-center text-center">
                    <div className="bg-[#0011FF] text-white text-[11px] font-bold px-6 py-1.5 rounded-full uppercase tracking-widest mb-6">Pro Plan</div>
                    <h3 className="text-[#0011FF] text-lg font-black font-heading tracking-widest mb-2 leading-tight">FOR DESIGNERS<br/>& CREATORS</h3>
                    <div className="text-[#0011FF] text-5xl font-black font-heading mb-6 tracking-tighter flex items-end justify-center">99k<span className="text-xl pb-1.5 tracking-normal">/Tháng</span></div>
                    <p className="text-[13px] text-gray-600 mb-8 font-medium px-2 leading-relaxed h-[60px]">
                      Các công cụ chuyên nghiệp dành riêng cho nhà thiết kế, người sáng tạo và tín đồ thời trang.
                    </p>
                    <ul className="w-full space-y-3 mb-8 text-[13px] font-medium text-left flex-1">
                      <li className="flex items-start leading-snug"><span className="mr-2 text-[#0011FF] font-bold">✓</span> Tính năng AI nâng cao</li>
                      <li className="flex items-start leading-snug"><span className="mr-2 text-[#0011FF] font-bold">✓</span> Ưu tiên tiến độ sản xuất</li>
                      <li className="flex items-start leading-snug"><span className="mr-2 text-[#0011FF] font-bold">✓</span> Đăng tải thiết kế lên sàn thương mại</li>
                      <li className="flex items-start leading-snug"><span className="mr-2 text-[#0011FF] font-bold">✓</span> Hỗ trợ kỹ thuật ưu tiên</li>
                    </ul>
                  </div>
                  <div>
                    <button onClick={() => navigate('/membership/checkout', { state: { plan: 'PRO STUDIO', price: 99000 } })} className="w-full py-3.5 bg-[#0011FF] text-white text-sm font-bold rounded-xl uppercase tracking-widest hover:bg-blue-800 transition-colors">
                      GO PRO
                    </button>
                    <div className="flex justify-center gap-1.5 mt-6 cursor-pointer pb-2">
                      <div onClick={() => handleDotClick(0)} className="w-1.5 h-1.5 rounded-full bg-[#0011FF]/30 transition-all hover:bg-[#0011FF]/50"></div>
                      <div onClick={() => handleDotClick(1)} className="w-1.5 h-1.5 rounded-full bg-[#0011FF]/30 transition-all hover:bg-[#0011FF]/50"></div>
                      <div onClick={() => handleDotClick(2)} className="w-5 h-1.5 rounded-full bg-[#0011FF] transition-all"></div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 2 — FAQ
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-24 bg-[#EBEBEB] px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-heading font-black text-center text-[#4A4A4A] mb-16 uppercase tracking-tight">CÂU HỎI THƯỜNG GẶP</h2>
          
          <div className="flex flex-col border border-black/30 bg-white shadow-sm">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border-b border-black/30 last:border-b-0">
                <button 
                  className={`w-full text-left px-6 py-6 md:px-8 md:py-8 font-medium text-lg md:text-xl transition-colors ${openFaq === idx ? 'bg-[#D6D6D6] text-black' : 'bg-white text-black hover:bg-gray-50'}`}
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                >
                  {faq.q}
                </button>
                
                {openFaq === idx && (
                  <div className="px-6 py-6 md:px-8 md:py-8 bg-white text-gray-600 text-sm md:text-base font-light border-t border-black/10 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}
