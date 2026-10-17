import { Link } from 'react-router-dom'
import { cn } from '@/utils/cn'
import logoSvg from '@/assets/logo1.png'

interface FooterProps {
  className?: string
}

// Icon Facebook theo chuẩn Feather/Lucide SVG spec
function FacebookIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

// Icon Instagram theo chuẩn Feather/Lucide SVG spec
function InstagramIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

export function Footer({ className }: FooterProps) {
  const navigateLinks = [
    { label: 'Trang chủ', href: '/' },
    { label: 'Khám phá Thiết kế (Marketplace)', href: '/marketplace' },
    { label: 'Xưởng Thiết kế 3D', href: '/design' },
    { label: 'Về chúng tôi', href: '/about' },
    { label: 'Tra cứu đơn hàng', href: '/orders' },
    { label: 'Hồ sơ cá nhân', href: '/profile' },
  ]

  return (
    <footer className={cn("bg-white py-16 md:py-24 font-body border-t border-gray-200", className)}>
      <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6">
        <div className="flex flex-col sm:grid sm:grid-cols-2 lg:flex lg:flex-row lg:justify-between gap-10 lg:gap-8">

          {/* ── Column 1: Brand & Newsletter ── */}
          <div className="w-full lg:max-w-[280px]">
            <Link to="/" className="inline-block mb-8">
              <img src={logoSvg} alt="ALTERA Logo" className="h-12 md:h-14 w-auto object-contain" />
            </Link>

            <form className="mb-4 max-w-[260px]" onSubmit={e => e.preventDefault()}>
              <input
                type="email"
                placeholder="Địa chỉ Email của bạn"
                className="w-full bg-transparent text-[11px] font-bold text-black placeholder:text-black mb-3 outline-none"
              />
              <Link to="/membership" className="w-full bg-gradient-brand text-white font-bold uppercase tracking-widest text-[10px] py-3 rounded-sm hover:opacity-90 transition-opacity flex justify-center items-center">
                ĐĂNG KÝ NHẬN TIN
              </Link>
            </form>
            <p className="text-[10px] leading-relaxed text-black max-w-[220px]">
              Bằng việc đăng ký, bạn đồng ý nhận thông tin ưu đãi và cập nhật mới nhất từ chúng tôi.
            </p>
          </div>

          {/* ── Column 2: NAVIGATE ── */}
          <div className="flex flex-col">
            <h3 className="heading-brand text-base md:text-lg text-black mb-6">ĐIỀU HƯỚNG</h3>
            <ul className="flex flex-col gap-3">
              {navigateLinks.map(link => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-[11px] md:text-xs text-black hover:text-cyan-500 transition-colors tracking-normal font-medium"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Column 3: SOCIAL ── */}
          <div className="flex flex-col">
            <h3 className="heading-brand text-base md:text-lg text-black mb-6">MẠNG XÃ HỘI</h3>
            <ul className="flex flex-col gap-3">
              <li>
                <a
                  href="https://www.instagram.com/altera.cloth?cplk=MWE2bWljNDRsNjN1cw%3D%3D&utm_source=qr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] md:text-xs text-black hover:text-cyan-500 transition-colors flex items-center gap-2 tracking-normal font-medium"
                >
                  <InstagramIcon className="h-3.5 w-3.5" /> Instagram
                </a>
              </li>
              <li>
                <a
                  href="https://www.facebook.com/profile.php?id=61595329141512"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] md:text-xs text-black hover:text-cyan-500 transition-colors flex items-center gap-2 tracking-normal font-medium"
                >
                  <FacebookIcon className="h-3.5 w-3.5" /> Facebook
                </a>
              </li>
            </ul>
          </div>

          {/* ── Column 4: SUPPORT ── */}
          <div className="flex flex-col justify-between">
            <div>
              <h3 className="heading-brand text-base md:text-lg text-black mb-6">HỖ TRỢ</h3>
              <div className="text-[11px] md:text-xs text-black leading-loose tracking-normal font-medium">
                Hỗ trợ từ Thứ 2 - Chủ Nhật <br />
                10:00 - 21:30 (GMT+7). <br />
                Liên hệ với chúng tôi bất cứ lúc nào.
              </div>
            </div>

            <p className="text-[11px] md:text-xs text-black mt-10 lg:mt-auto tracking-normal font-medium">
              © Bản quyền thuộc về ALTERA 2026
            </p>
          </div>

        </div>
      </div>
    </footer>
  )
}
