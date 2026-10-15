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

  const policyLinks = [
    { label: 'Chính sách hội viên', href: '/membership' },
    { label: 'Chính sách đổi trả', href: '#' },
    { label: 'Chính sách giao hàng', href: '#' },
    { label: 'Chính sách bảo mật', href: '#' },
    { label: 'Điều khoản dịch vụ', href: '#' },
  ]

  return (
    <footer className={cn("bg-white py-16 md:py-24 font-body border-t border-gray-200", className)}>
      <div className="mx-auto max-w-[var(--spacing-contentMax)] px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 lg:gap-8">

          {/* ── Column 1: Brand & Newsletter ── */}
          <div className="lg:col-span-2 pr-0 md:pr-12">
            <Link to="/" className="inline-block mb-10">
              <img src={logoSvg} alt="ALTERA Logo" className="h-12 md:h-16 w-auto object-contain" />
            </Link>

            <form className="mb-4 max-w-[240px]" onSubmit={e => e.preventDefault()}>
              <input
                type="email"
                placeholder="Địa chỉ Email của bạn"
                className="w-full bg-transparent text-[10px] font-bold text-black placeholder:text-black mb-3 outline-none"
              />
              <Link to="/membership" className="w-full bg-gradient-brand text-white font-bold uppercase tracking-widest text-[10px] py-3 rounded-sm hover:opacity-90 transition-opacity flex justify-center items-center">
                ĐĂNG KÝ NHẬN TIN
              </Link>
            </form>
            <p className="text-[10px] leading-relaxed text-black max-w-[200px]">
              Bằng việc đăng ký, bạn đồng ý với <br />
              Chính sách bảo mật của chúng tôi.
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
                    className="text-[11px] md:text-xs text-black hover:text-cyan-500 transition-colors tracking-tight font-medium"
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
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] md:text-xs text-black hover:text-cyan-500 transition-colors flex items-center gap-2 tracking-tight font-medium"
                >
                  <InstagramIcon className="h-3.5 w-3.5" /> Instagram
                </a>
              </li>
              <li>
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] md:text-xs text-black hover:text-cyan-500 transition-colors flex items-center gap-2 tracking-tight font-medium"
                >
                  <FacebookIcon className="h-3.5 w-3.5" /> Facebook
                </a>
              </li>
            </ul>
          </div>

          {/* ── Column 4: OFFICIAL / POLICIES ── */}
          <div className="flex flex-col">
            <h3 className="heading-brand text-base md:text-lg text-black mb-6">CHÍNH SÁCH</h3>
            <ul className="flex flex-col gap-3">
              {policyLinks.map(link => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-[11px] md:text-xs text-black hover:text-cyan-500 transition-colors tracking-tight font-medium"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Column 5: SUPPORT ── */}
          <div className="flex flex-col">
            <h3 className="heading-brand text-base md:text-lg text-black mb-6">HỖ TRỢ</h3>
            <div className="text-[11px] md:text-xs text-black leading-loose mb-12 tracking-tight font-medium">
              Hỗ trợ từ Thứ 2 - Chủ Nhật <br />
              10:00 - 21:30 (GMT+7). <br />
              Liên hệ với chúng tôi bất cứ lúc nào.
            </div>

            <p className="text-[11px] md:text-xs text-black mt-auto tracking-tight font-medium">
              © Bản quyền thuộc về ALTERA 2026
            </p>
          </div>

        </div>
      </div>
    </footer>
  )
}
