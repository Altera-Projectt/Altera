import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Crown, QrCode, CheckCircle2, ShieldCheck, X, Copy, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'
import { AuthService } from '@/services/auth.api'
import { MembershipService, type BankConfig, type BankTransferInfo } from '@/services/membership.api'
import { formatVND } from '@/utils/format'

import homepage2 from '@/assets/homepage2.jpg'

const FALLBACK_BANK_ID = import.meta.env.VITE_ADMIN_BANK_ID || 'MB'
const FALLBACK_BANK_NAME = import.meta.env.VITE_ADMIN_BANK_NAME || 'MBBank'
const FALLBACK_BANK_ACCOUNT = import.meta.env.VITE_ADMIN_BANK_ACCOUNT || '0384431663'
const FALLBACK_ACCOUNT_NAME = import.meta.env.VITE_ADMIN_ACCOUNT_NAME || 'HUYNH ANH KHOI'

export function MembershipPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, updateUser } = useAuthStore();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const totalCards = 3;

  // Upgrade modal & Render env bank state
  const [upgradeModalTier, setUpgradeModalTier] = useState<'PREMIUM' | 'PRO' | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [loadingTransfer, setLoadingTransfer] = useState(false);
  const [bankConfig, setBankConfig] = useState<BankConfig | null>(null);
  const [transferInfo, setTransferInfo] = useState<BankTransferInfo | null>(null);

  const effectiveTier = user?.effectiveTier || (user?.role === 'ADMIN' || user?.isLifetimeMembership ? 'PRO' : user?.membershipTier || 'FREE');
  const isLifetime = Boolean(user?.role === 'ADMIN' || user?.isLifetimeMembership);
  const daysRemaining = user?.daysRemaining ?? null;

  useEffect(() => {
    // Lấy cấu hình tài khoản ngân hàng từ .env trên Render Backend
    MembershipService.plans()
      .then((res) => {
        if (res.data?.data?.bankConfig) {
          setBankConfig(res.data.data.bankConfig);
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      AuthService.getMe()
        .then((res) => {
          const fetched = (res.data.data as any)?.user || res.data.data;
          if (fetched) updateUser(fetched);
        })
        .catch(() => undefined);
    }
  }, [isAuthenticated, updateUser]);

  const faqs = [
    { q: "Làm thế nào để chuyển đổi từ bản thiết kế sang trang phục thực tế?", a: "Mỗi thiết kế tạo bởi ALTERA sẽ tự động xuất file kỹ thuật số chuẩn xác. Thành viên Premium và Pro có thể bấm 'May đo ngay' để gửi yêu cầu trực tiếp tới xưởng may đối tác của chúng mình và sẽ được hoàn thiện sớm." },
    { q: "Bản quyền sở hữu trí tuệ đối với các thiết kế thuộc về ai?", a: "Mọi thiết kế do bạn sáng tạo thông qua nền tảng ALTERA đều thuộc 100% quyền sở hữu thương mại của bạn. Chúng tôi cam kết bảo mật bản vẽ độc quyền và không tái phân phối cho bên thứ ba." },
    { q: "Tôi có thể hủy gói hoặc thay đổi chu kỳ thanh toán không?", a: "Có. Bạn có thể nâng cấp, hạ cấp hoặc hủy gói bất kỳ lúc nào ngay trong phần Cài đặt tài khoản mà không phát sinh thêm bất kỳ chi phí ẩn nào." }
  ];

  const scrollToIndex = (index: number) => {
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.clientWidth;
      scrollRef.current.scrollTo({
        left: index * cardWidth,
        behavior: 'smooth'
      });
      setCurrentIndex(index);
    }
  };

  useEffect(() => {
    if (isHovered || upgradeModalTier) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % totalCards;
        scrollToIndex(next);
        return next;
      });
    }, 3500);
    return () => clearInterval(interval);
  }, [isHovered, upgradeModalTier]);

  const handleDotClick = (index: number) => {
    scrollToIndex(index);
  };
  
  const handlePrev = () => {
    const prev = (currentIndex - 1 + totalCards) % totalCards;
    scrollToIndex(prev);
  };
  
  const handleNext = () => {
    const next = (currentIndex + 1) % totalCards;
    scrollToIndex(next);
  };

  const handleOpenUpgradeModal = async (tier: 'PREMIUM' | 'PRO') => {
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập để nâng cấp gói hội viên');
      navigate('/auth/login', { state: { from: { pathname: '/membership' } } });
      return;
    }
    setUpgradeModalTier(tier);
    setTransferInfo(null);
    setLoadingTransfer(true);
    try {
      const planCode = tier === 'PRO' ? 'PRO_STUDIO' : 'PREMIUM';
      const res = await MembershipService.checkout({
        planCode,
        paymentMethod: 'BANK_TRANSFER',
        fullName: user?.fullName || 'Hội viên ALTERA',
        email: user?.email,
        phone: user?.phone || '0900000000',
      });
      if (res.data?.data?.transfer) {
        setTransferInfo(res.data.data.transfer);
      }
    } catch {
      // Nếu lỗi mạng tạm thời, fallback sang bankConfig đã tải từ Render
    } finally {
      setLoadingTransfer(false);
    }
  };

  // Tự động kiểm tra trạng thái thanh toán định kỳ (Auto-polling khi nhận Webhook VietQR)
  useEffect(() => {
    const ref = transferInfo?.paymentReference;
    if (!upgradeModalTier || !ref || upgrading) return;

    let active = true;
    const timer = window.setInterval(async () => {
      try {
        const res = await MembershipService.result(ref);
        const paymentStatus = res.data?.data?.payment?.paymentStatus;
        if (active && (paymentStatus === 'SUCCESS' || paymentStatus === 'PAID')) {
          window.clearInterval(timer);
          const meRes = await AuthService.getMe();
          const fetched = (meRes.data.data as any)?.user || meRes.data.data;
          if (fetched) updateUser(fetched);
          toast.success(`Thanh toán thành công! Đã tự động kích hoạt gói ${upgradeModalTier}.`);
          setUpgradeModalTier(null);
          setTransferInfo(null);
        }
      } catch {
        // Bỏ qua lỗi ngầm trong lúc chờ thanh toán
      }
    }, 4000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [upgradeModalTier, transferInfo?.paymentReference, upgrading, updateUser]);

  const handleConfirmUpgrade = async () => {
    if (!upgradeModalTier || upgrading) return;
    try {
      setUpgrading(true);
      const res = await MembershipService.upgrade({
        tier: upgradeModalTier,
        paymentMethod: 'BANK_TRANSFER',
        paymentReference: transferInfo?.paymentReference,
      });
      const updatedUser = res.data.data?.user;
      if (updatedUser) {
        updateUser(updatedUser);
      }
      toast.success(
        res.data.message ||
          `Chúc mừng! Bạn đã nâng cấp gói ${upgradeModalTier} thành công (Thời hạn 30 ngày).`
      );
      setUpgradeModalTier(null);
      setTransferInfo(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Nâng cấp gói hội viên thất bại. Vui lòng thử lại.');
    } finally {
      setUpgrading(false);
    }
  };

  const activeBankId = transferInfo?.bankCode || bankConfig?.bankCode || FALLBACK_BANK_ID;
  const activeBankName = transferInfo?.bankName || bankConfig?.bankName || FALLBACK_BANK_NAME;
  const activeBankAccount = transferInfo?.accountNumber || bankConfig?.accountNumber || FALLBACK_BANK_ACCOUNT;
  const activeAccountName = transferInfo?.accountName || bankConfig?.accountName || FALLBACK_ACCOUNT_NAME;

  const modalPrice = transferInfo?.amount ?? (upgradeModalTier === 'PRO' ? 99000 : 59000);
  const cleanUsername = (user?.email?.split('@')[0] || user?.fullName || 'MEMBER')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase();
  const transferContent =
    transferInfo?.paymentContent ||
    (upgradeModalTier ? `ALTERA ${upgradeModalTier} ${cleanUsername}` : '');
  const qrCodeUrl =
    transferInfo?.qrCodeUrl ||
    (upgradeModalTier
      ? `https://img.vietqr.io/image/${encodeURIComponent(activeBankId)}-${encodeURIComponent(
          activeBankAccount
        )}-compact2.png?amount=${modalPrice}&addInfo=${encodeURIComponent(
          transferContent
        )}&accountName=${encodeURIComponent(activeAccountName)}`
      : '');

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

        <div className="max-w-[var(--spacing-contentMax)] mx-auto w-full relative z-10 flex flex-col lg:flex-row justify-between items-center px-8 md:px-14 lg:px-20 gap-12">
          {/* Left Text Content */}
          <div className="w-full lg:flex-1 lg:max-w-2xl">
            {isAuthenticated && user && (
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-[#0F172A]/90 px-4 py-1.5 text-xs font-bold text-cyan-400 mb-5 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
                <Crown className="h-4 w-4 text-amber-400" />
                {isLifetime ? (
                  <span>👑 ADMIN • PRO VĨNH VIỄN</span>
                ) : effectiveTier === 'PRO' ? (
                  <span>👑 GÓI PRO ĐANG KÍCH HOẠT • Còn {daysRemaining ?? 30} ngày</span>
                ) : effectiveTier === 'PREMIUM' ? (
                  <span>💎 GÓI PREMIUM ĐANG KÍCH HOẠT • Còn {daysRemaining ?? 30} ngày</span>
                ) : (
                  <span>GÓI HIỆN TẠI: MIỄN PHÍ (1 ảnh AI/tuần)</span>
                )}
              </div>
            )}
            <h2 className="text-[clamp(2.2rem,3.6vw,3.5rem)] font-heading font-black mb-6 leading-[1.15] tracking-normal uppercase">
              Trải nghiệm Trọn vẹn <br />
              Tiện ích cùng ALTERA
            </h2>
            <div className="w-24 h-1 bg-white mb-6"></div>
            <p className="text-base md:text-lg font-medium mb-10 text-gray-300 max-w-lg leading-relaxed">
              Khai phá toàn bộ sức mạnh của ALTERA. Đặc quyền sử dụng các công cụ thiết kế cao cấp, nhận gợi ý thông minh hơn từ AI và sở hữu các bộ sưu tập thời trang giới hạn dành riêng cho thành viên.
            </p>
            <ul className="space-y-4">
              {[
                'Gợi ý phong cách từ AI không giới hạn',
                'Sáng tạo trang phục 3D Studio chuyên nghiệp',
                'Đăng bán thiết kế thương mại lên Marketplace',
                'Huy hiệu Vương miện & Viền Avatar VIP độc quyền',
                'Lưu trữ thiết kế đám mây không giới hạn',
                'Ưu tiên sản xuất & Hỗ trợ kỹ thuật 24/7'
              ].map((item, i) => (
                <li key={i} className="flex items-center text-gray-200 text-[15px] md:text-base font-medium">
                  <span className="mr-3 font-bold text-lg text-cyan-400">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Right Cards Slider - EXACTLY 1 CARD VISIBLE AT A TIME */}
          <div className="w-full lg:w-auto flex flex-col items-center lg:items-end shrink-0">
            {/* Quick tier switcher tabs */}
            <div className="mb-4 flex items-center gap-1.5 rounded-full bg-[#0F172A]/90 p-1.5 border border-cyan-400/30">
              {[
                { label: 'Miễn Phí', idx: 0 },
                { label: 'Premium 59k', idx: 1 },
                { label: 'Pro 99k 👑', idx: 2 },
              ].map((tab) => (
                <button
                  key={tab.idx}
                  type="button"
                  onClick={() => handleDotClick(tab.idx)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    currentIndex === tab.idx
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* The wrapper that defines the bounds */}
            <div 
              className="relative w-full max-w-[380px] group/slider"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {/* Navigation Arrows */}
              <button onClick={handlePrev} aria-label="Gói trước" className="absolute left-2 top-[40%] -translate-y-1/2 z-20 text-black/30 hover:text-[#0011FF] bg-white/80 hover:bg-white rounded-full p-2 transition-all hidden md:block opacity-0 group-hover/slider:opacity-100 shadow">
                <ChevronLeft size={28} strokeWidth={2} />
              </button>
              <button onClick={handleNext} aria-label="Gói tiếp theo" className="absolute right-2 top-[40%] -translate-y-1/2 z-20 text-black/30 hover:text-[#0011FF] bg-white/80 hover:bg-white rounded-full p-2 transition-all hidden md:block opacity-0 group-hover/slider:opacity-100 shadow">
                <ChevronRight size={28} strokeWidth={2} />
              </button>

              {/* The single card container that acts as a window */}
              <div className="relative w-full h-[610px] rounded-[24px] overflow-hidden shadow-2xl bg-white">
              
              {/* Horizontal Scroll Container inside the card window */}
              <div 
                ref={scrollRef}
                className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none h-full w-full" 
                style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                
                {/* Card 1: FREE */}
                <div className="min-w-full w-full bg-white text-black p-8 flex flex-col justify-between snap-center border-[3px] border-[#0011FF] rounded-[24px] shrink-0 h-full relative">
                  <div className="flex flex-col items-center text-center">
                    <div className="bg-[#0011FF] text-white text-[11px] font-bold px-6 py-1.5 rounded-full uppercase tracking-widest mb-6">Gói Miễn Phí</div>
                    <h3 className="text-[#0011FF] text-xl font-black font-heading tracking-normal mb-2">CƠ BẢN</h3>
                    <div className="text-[#0011FF] text-5xl font-black font-heading mb-6 tracking-normal">MIỄN PHÍ</div>
                    <p className="text-[13px] text-gray-600 mb-6 font-medium px-2 leading-relaxed h-[54px]">
                      Trải nghiệm tính năng định hình phong cách bằng AI và mua sắm các thiết kế độc bản trên sàn.
                    </p>
                    <ul className="w-full space-y-3 mb-6 text-[13px] font-medium text-left flex-1">
                      <li className="flex items-start leading-snug"><span className="mr-2 text-[#0011FF] font-bold">✓</span> Mua sắm sản phẩm trên toàn hệ thống</li>
                      <li className="flex items-start leading-snug"><span className="mr-2 text-[#0011FF] font-bold">✓</span> Tạo tối đa 1 ảnh thiết kế AI / tuần</li>
                      <li className="flex items-start leading-snug text-gray-400"><span className="mr-2 text-rose-500 font-bold">✕</span> Không hỗ trợ lưu thiết kế 3D & Đăng bán</li>
                    </ul>
                  </div>
                  <div>
                    {!isAuthenticated ? (
                      <button onClick={() => navigate('/auth/register')} className="w-full py-3.5 bg-[#0011FF] text-white text-sm font-bold rounded-xl uppercase tracking-widest hover:bg-blue-800 transition-colors">
                        BẮT ĐẦU NGAY
                      </button>
                    ) : effectiveTier === 'FREE' ? (
                      <button disabled className="w-full py-3.5 bg-slate-200 text-slate-700 text-sm font-bold rounded-xl uppercase tracking-widest cursor-default">
                        ĐANG SỬ DỤNG
                      </button>
                    ) : (
                      <button onClick={() => navigate('/design?tab=ai')} className="w-full py-3.5 bg-slate-100 text-[#0011FF] text-sm font-bold rounded-xl uppercase tracking-widest hover:bg-slate-200 transition-colors">
                        ĐÃ BAO GỒM TRONG VIP
                      </button>
                    )}
                    <div className="flex justify-center gap-1.5 mt-6 cursor-pointer pb-2">
                      <div onClick={() => handleDotClick(0)} className={`h-1.5 rounded-full transition-all ${currentIndex === 0 ? 'w-5 bg-[#0011FF]' : 'w-1.5 bg-[#0011FF]/30 hover:bg-[#0011FF]/50'}`}></div>
                      <div onClick={() => handleDotClick(1)} className={`h-1.5 rounded-full transition-all ${currentIndex === 1 ? 'w-5 bg-[#0011FF]' : 'w-1.5 bg-[#0011FF]/30 hover:bg-[#0011FF]/50'}`}></div>
                      <div onClick={() => handleDotClick(2)} className={`h-1.5 rounded-full transition-all ${currentIndex === 2 ? 'w-5 bg-[#0011FF]' : 'w-1.5 bg-[#0011FF]/30 hover:bg-[#0011FF]/50'}`}></div>
                    </div>
                  </div>
                </div>

                {/* Card 2: PREMIUM */}
                <div className="min-w-full w-full bg-white text-black p-8 flex flex-col justify-between snap-center border-[3px] border-[#00C8FF] rounded-[24px] shrink-0 h-full relative">
                  <div className="flex flex-col items-center text-center">
                    <div className="bg-[#0011FF] text-white text-[11px] font-bold px-6 py-1.5 rounded-full uppercase tracking-widest mb-6">Phổ Biến Nhất</div>
                    <h3 className="text-[#0011FF] text-xl font-black font-heading tracking-normal mb-2">PREMIUM</h3>
                    <div className="text-[#0011FF] text-5xl font-black font-heading mb-6 tracking-normal flex items-end justify-center">59k<span className="text-xl pb-1.5 tracking-normal">/Tháng</span></div>
                    <p className="text-[13px] text-gray-600 mb-6 font-medium px-2 leading-relaxed h-[54px]">
                      Trọn bộ tính năng cần thiết để định hình phong cách, thiết kế 3D và bắt đầu kinh doanh.
                    </p>
                    <ul className="w-full space-y-3 mb-6 text-[13px] font-medium text-left flex-1">
                      <li className="flex items-start leading-snug"><span className="mr-2 text-[#0011FF] font-bold">✓</span> Tạo ảnh thiết kế bằng AI không giới hạn</li>
                      <li className="flex items-start leading-snug"><span className="mr-2 text-[#0011FF] font-bold">✓</span> Mở khóa toàn bộ công cụ 3D Studio</li>
                      <li className="flex items-start leading-snug"><span className="mr-2 text-[#0011FF] font-bold">✓</span> Đăng bán tối đa 3 sản phẩm / tuần lên Marketplace</li>
                      <li className="flex items-start leading-snug"><span className="mr-2 text-[#0011FF] font-bold">✓</span> Huy hiệu Vương miện Bạc & Viền Avatar VIP</li>
                    </ul>
                  </div>
                  <div>
                    {effectiveTier === 'PREMIUM' ? (
                      <button
                        onClick={() => handleOpenUpgradeModal('PREMIUM')}
                        className="w-full py-3.5 bg-cyan-600 text-white text-xs font-bold rounded-xl uppercase tracking-wider hover:bg-cyan-700 transition-colors"
                      >
                        ĐANG SỬ DỤNG (Còn {daysRemaining ?? 30} ngày)
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenUpgradeModal('PREMIUM')}
                        className="w-full py-3.5 bg-[#0011FF] text-white text-sm font-bold rounded-xl uppercase tracking-widest hover:bg-blue-800 transition-colors"
                      >
                        NÂNG CẤP NGAY
                      </button>
                    )}
                    <div className="flex justify-center gap-1.5 mt-6 cursor-pointer pb-2">
                      <div onClick={() => handleDotClick(0)} className={`h-1.5 rounded-full transition-all ${currentIndex === 0 ? 'w-5 bg-[#0011FF]' : 'w-1.5 bg-[#0011FF]/30 hover:bg-[#0011FF]/50'}`}></div>
                      <div onClick={() => handleDotClick(1)} className={`h-1.5 rounded-full transition-all ${currentIndex === 1 ? 'w-5 bg-[#0011FF]' : 'w-1.5 bg-[#0011FF]/30 hover:bg-[#0011FF]/50'}`}></div>
                      <div onClick={() => handleDotClick(2)} className={`h-1.5 rounded-full transition-all ${currentIndex === 2 ? 'w-5 bg-[#0011FF]' : 'w-1.5 bg-[#0011FF]/30 hover:bg-[#0011FF]/50'}`}></div>
                    </div>
                  </div>
                </div>

                {/* Card 3: PRO */}
                <div className="min-w-full w-full bg-white text-black p-8 flex flex-col justify-between snap-center border-[3px] border-[#00C8FF] rounded-[24px] shrink-0 h-full relative">
                  <div className="flex flex-col items-center text-center">
                    <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-[11px] font-black px-6 py-1.5 rounded-full uppercase tracking-widest mb-6 flex items-center gap-1.5 shadow">
                      <Crown className="h-3.5 w-3.5" /> Gói Pro VIP
                    </div>
                    <h3 className="text-[#0011FF] text-base font-black font-heading tracking-normal mb-2 leading-tight uppercase">DÀNH CHO NHÀ THIẾT KẾ<br/>& SÁNG TẠO</h3>
                    <div className="text-[#0011FF] text-5xl font-black font-heading mb-6 tracking-normal flex items-end justify-center">99k<span className="text-xl pb-1.5 tracking-normal">/Tháng</span></div>
                    <p className="text-[13px] text-gray-600 mb-6 font-medium px-2 leading-relaxed h-[54px]">
                      Đặc quyền không giới hạn dành riêng cho nhà thiết kế chuyên nghiệp và thương hiệu thời trang.
                    </p>
                    <ul className="w-full space-y-3 mb-6 text-[13px] font-medium text-left flex-1">
                      <li className="flex items-start leading-snug"><span className="mr-2 text-[#0011FF] font-bold">✓</span> Tạo ảnh AI & Thiết kế 3D không giới hạn</li>
                      <li className="flex items-start leading-snug"><span className="mr-2 text-[#0011FF] font-bold">✓</span> Đăng bán sản phẩm lên Marketplace không giới hạn</li>
                      <li className="flex items-start leading-snug"><span className="mr-2 text-[#0011FF] font-bold">✓</span> Huy hiệu Vương miện Vàng & Viền Avatar Hoàng Kim</li>
                      <li className="flex items-start leading-snug"><span className="mr-2 text-[#0011FF] font-bold">✓</span> Ưu tiên duyệt thiết kế & Hỗ trợ kỹ thuật 24/7</li>
                    </ul>
                  </div>
                  <div>
                    {isLifetime ? (
                      <button
                        disabled
                        className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 text-xs font-black rounded-xl uppercase tracking-wider shadow-md cursor-default"
                      >
                        👑 GÓI VĨNH VIỄN
                      </button>
                    ) : effectiveTier === 'PRO' ? (
                      <button
                        onClick={() => handleOpenUpgradeModal('PRO')}
                        className="w-full py-3.5 bg-amber-500 text-slate-950 text-xs font-black rounded-xl uppercase tracking-wider hover:bg-amber-400 transition-colors"
                      >
                        ĐANG SỬ DỤNG (Còn {daysRemaining ?? 30} ngày)
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenUpgradeModal('PRO')}
                        className="w-full py-3.5 bg-[#0011FF] text-white text-sm font-bold rounded-xl uppercase tracking-widest hover:bg-blue-800 transition-colors"
                      >
                        NÂNG CẤP NGAY
                      </button>
                    )}
                    <div className="flex justify-center gap-1.5 mt-6 cursor-pointer pb-2">
                      <div onClick={() => handleDotClick(0)} className={`h-1.5 rounded-full transition-all ${currentIndex === 0 ? 'w-5 bg-[#0011FF]' : 'w-1.5 bg-[#0011FF]/30 hover:bg-[#0011FF]/50'}`}></div>
                      <div onClick={() => handleDotClick(1)} className={`h-1.5 rounded-full transition-all ${currentIndex === 1 ? 'w-5 bg-[#0011FF]' : 'w-1.5 bg-[#0011FF]/30 hover:bg-[#0011FF]/50'}`}></div>
                      <div onClick={() => handleDotClick(2)} className={`h-1.5 rounded-full transition-all ${currentIndex === 2 ? 'w-5 bg-[#0011FF]' : 'w-1.5 bg-[#0011FF]/30 hover:bg-[#0011FF]/50'}`}></div>
                    </div>
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
          <h2 className="text-4xl md:text-5xl font-heading font-black text-center text-[#4A4A4A] mb-16 uppercase tracking-normal">CÂU HỎI THƯỜNG GẶP</h2>
          
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

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          MODAL THANH TOÁN NÂNG CẤP HỘI VIÊN (DARK NAVY)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {upgradeModalTier && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="upgrade-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#060B16]/85 p-4 backdrop-blur-md overflow-y-auto"
          onClick={() => !upgrading && setUpgradeModalTier(null)}
        >
          <div
            className="relative w-full max-w-2xl rounded-2xl border border-cyan-400/30 bg-[#0F172A] p-6 md:p-8 text-slate-100 shadow-[0_25px_70px_rgba(0,0,0,0.85)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              disabled={upgrading}
              onClick={() => setUpgradeModalTier(null)}
              aria-label="Đóng cửa sổ nâng cấp"
              className="absolute right-4 top-4 rounded-lg border border-cyan-400/20 bg-[#162038] p-2 text-slate-400 transition hover:border-cyan-400/50 hover:text-slate-100"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-[#162038] px-3 py-1 text-xs font-bold uppercase text-cyan-400">
                <Crown className="h-3.5 w-3.5 text-amber-400" />
                Nâng cấp đặc quyền VIP
              </span>
            </div>

            <h3 id="upgrade-modal-title" className="text-2xl font-bold tracking-normal text-slate-100">
              Kích hoạt Gói Hội Viên {upgradeModalTier === 'PRO' ? 'PRO STUDIO 👑' : 'PREMIUM 💎'}
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Quét mã VietQR bên dưới để thanh toán và mở khóa ngay toàn bộ đặc quyền trong 30 ngày.
            </p>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-[210px_minmax(0,1fr)] gap-6 items-center rounded-xl border border-cyan-400/20 bg-[#0A1122] p-5 overflow-hidden">
              {/* QR Code */}
              <div className="flex flex-col items-center rounded-xl bg-white p-3.5 shadow-[0_8px_24px_rgba(0,0,0,0.4)] mx-auto w-full max-w-[210px]">
                {loadingTransfer ? (
                  <div className="flex h-44 w-44 flex-col items-center justify-center gap-2 text-slate-600">
                    <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
                    <span className="text-xs font-medium">Đang tạo mã VietQR...</span>
                  </div>
                ) : (
                  <img
                    src={qrCodeUrl}
                    alt={`Mã VietQR nâng cấp gói ${upgradeModalTier}`}
                    className="h-44 w-44 object-contain"
                  />
                )}
                <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 whitespace-nowrap">
                  <QrCode className="h-3.5 w-3.5 text-blue-600 shrink-0" /> Quét mã bằng App Ngân hàng
                </span>
              </div>

              {/* Payment details */}
              <div className="min-w-0 w-full space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2">
                  <span className="text-slate-400 shrink-0 whitespace-nowrap">Gói đăng ký:</span>
                  <span className="font-bold text-cyan-400 text-right whitespace-nowrap">
                    {upgradeModalTier === 'PRO' ? 'GÓI PRO (99k/Tháng)' : 'GÓI PREMIUM (59k/Tháng)'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2">
                  <span className="text-slate-400 shrink-0 whitespace-nowrap">Thời hạn sử dụng:</span>
                  <span className="font-semibold text-slate-100 text-right whitespace-nowrap">30 ngày (1 Tháng)</span>
                </div>
                <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2">
                  <span className="text-slate-400 shrink-0 whitespace-nowrap">Ngân hàng nhận:</span>
                  <span className="font-semibold text-slate-100 text-right truncate">{activeBankName}</span>
                </div>
                <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2">
                  <span className="text-slate-400 shrink-0 whitespace-nowrap">Chủ tài khoản:</span>
                  <span className="font-semibold text-slate-100 text-right truncate">{activeAccountName}</span>
                </div>
                <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2">
                  <span className="text-slate-400 shrink-0 whitespace-nowrap">Số tài khoản:</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(activeBankAccount);
                      toast.success('Đã sao chép số tài khoản');
                    }}
                    className="inline-flex items-center gap-1.5 font-mono font-bold text-cyan-400 hover:underline shrink-0"
                  >
                    {activeBankAccount} <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2">
                  <span className="text-slate-400 shrink-0 whitespace-nowrap">Tổng thanh toán:</span>
                  <span className="text-base font-black text-amber-400 text-right whitespace-nowrap">{formatVND(modalPrice)}</span>
                </div>
                <div className="min-w-0">
                  <span className="block text-xs text-slate-400 mb-1.5">Nội dung chuyển khoản (Tự động):</span>
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-cyan-400/30 bg-[#162038] px-3 py-2 font-mono text-xs font-bold text-cyan-300 w-full min-w-0">
                    <span className="truncate min-w-0 flex-1">{transferContent}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(transferContent);
                        toast.success('Đã sao chép nội dung chuyển khoản');
                      }}
                      className="text-slate-300 hover:text-white shrink-0"
                      title="Sao chép nội dung"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-[#162038]/60 px-4 py-2.5 text-xs text-slate-300">
              <ShieldCheck className="h-4 w-4 text-cyan-400 shrink-0" />
              <span>
                Sau khi chuyển khoản thành công, hệ thống sẽ tự động kích hoạt hoặc bạn có thể bấm nút xác nhận bên dưới để mở khóa ngay.
              </span>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
              <button
                type="button"
                disabled={upgrading}
                onClick={() => setUpgradeModalTier(null)}
                className="rounded-xl border border-slate-700 bg-[#162038] px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-300 transition hover:bg-slate-800"
              >
                Để sau
              </button>
              <button
                type="button"
                disabled={upgrading}
                onClick={handleConfirmUpgrade}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-100 shadow-[0_0_20px_rgba(59,130,246,0.35)] transition hover:bg-blue-600 disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4 text-cyan-300" />
                {upgrading ? 'Đang kích hoạt gói VIP...' : 'Tôi đã chuyển khoản (Kích hoạt ngay)'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
