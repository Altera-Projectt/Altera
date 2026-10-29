import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import ShirtCanvas3D from '@/components/studio/ShirtCanvas3D'
import homepage0 from '@/assets/homepage0.png'
import logoSvg from '@/assets/logo1.png'
import { MarketplaceService, type MarketplaceDesign } from '@/services/marketplace.api'
import { formatVND, optimizeCloudinaryUrl } from '@/utils/format'

type TshirtSizeCode = 'S' | 'M' | 'L' | 'XL' | 'XXL'

interface TshirtSizeSpec {
  size: TshirtSizeCode
  badge: string
  typicalNote: string
  heightRange: string
  weightRange: string
  bustRange: string
  waistRange: string
  hipRange: string
  shirtChest: string
  shirtLength: string
  shirtShoulder: string
  shirtSleeve: string
}

const ALTERA_SINGLE_SHIRT = {
  name: 'Áo Thun Cotton Heavyweight 280gsm',
  spec: '100% Cotton 2 chiều cao cấp · Form Unisex chuẩn ALTERA',
  price: 179000,
  badge: 'Phôi chuẩn duy nhất',
}

const TSHIRT_HERO_HIGHLIGHTS = [
  {
    code: '01',
    badge: 'Phôi duy nhất',
    rightLabel: '179.000 ₫',
    title: 'Áo Thun Cotton Heavyweight 280gsm',
    spec: '100% Cotton 2 chiều dày dặn · Đứng form Unisex chuẩn ALTERA',
    to: '/products',
  },
  {
    code: '02',
    badge: 'Size S – XXL',
    rightLabel: '45 – 98 kg',
    title: 'Chọn Size Hoặc Nhập Số Đo 3 Vòng',
    spec: 'Tự động gợi ý size chuẩn theo chiều cao, cân nặng & 3 vòng',
    to: '#clip-huong-dan-thiet-ke',
  },
  {
    code: '03',
    badge: '3D & AI Studio',
    rightLabel: 'Xoay 360°',
    title: 'Tự Thiết Kế Hình In AI Độc Bản',
    spec: 'Nhập Prompt tiếng Việt sinh họa tiết, tách nền PNG & ướm 3D',
    to: '/design',
  },
  {
    code: '04',
    badge: 'Marketplace',
    rightLabel: 'Hoa hồng 5%',
    title: 'Mua Áo Thiết Kế Hoặc Mở Bán',
    spec: 'Áo hoàn chỉnh từ 219.000 ₫ · Creator nhận 5% bản quyền mỗi đơn',
    to: '/marketplace',
  },
]

const TSHIRT_SIZE_CHART: TshirtSizeSpec[] = [
  {
    size: 'S',
    badge: 'Nhỏ gọn',
    typicalNote: 'Chuẩn dáng ~1m58 · 52 kg',
    heightRange: '1m53 – 1m63',
    weightRange: '45 – 56 kg',
    bustRange: '80 – 87 cm',
    waistRange: '64 – 71 cm',
    hipRange: '84 – 90 cm',
    shirtChest: '106 cm',
    shirtLength: '67 cm',
    shirtShoulder: '49 cm',
    shirtSleeve: '21 cm',
  },
  {
    size: 'M',
    badge: 'Phổ biến',
    typicalNote: 'Chuẩn dáng ~1m70 · 65 kg',
    heightRange: '1m64 – 1m72',
    weightRange: '57 – 66 kg',
    bustRange: '88 – 94 cm',
    waistRange: '72 – 79 cm',
    hipRange: '91 – 97 cm',
    shirtChest: '112 cm',
    shirtLength: '70 cm',
    shirtShoulder: '51 cm',
    shirtSleeve: '22 cm',
  },
  {
    size: 'L',
    badge: 'Thoải mái',
    typicalNote: 'Chuẩn dáng ~1m75 · 72 kg',
    heightRange: '1m73 – 1m78',
    weightRange: '67 – 76 kg',
    bustRange: '95 – 101 cm',
    waistRange: '80 – 87 cm',
    hipRange: '98 – 104 cm',
    shirtChest: '118 cm',
    shirtLength: '73 cm',
    shirtShoulder: '53 cm',
    shirtSleeve: '23 cm',
  },
  {
    size: 'XL',
    badge: 'Form lớn',
    typicalNote: 'Chuẩn dáng ~1m81 · 82 kg',
    heightRange: '1m79 – 1m84',
    weightRange: '77 – 86 kg',
    bustRange: '102 – 108 cm',
    waistRange: '88 – 95 cm',
    hipRange: '105 – 111 cm',
    shirtChest: '124 cm',
    shirtLength: '75 cm',
    shirtShoulder: '55 cm',
    shirtSleeve: '24 cm',
  },
  {
    size: 'XXL',
    badge: 'Ngoại cỡ',
    typicalNote: 'Chuẩn dáng ~1m87 · 92 kg',
    heightRange: '1m85 – 1m92',
    weightRange: '87 – 98 kg',
    bustRange: '109 – 116 cm',
    waistRange: '96 – 104 cm',
    hipRange: '112 – 118 cm',
    shirtChest: '130 cm',
    shirtLength: '77 cm',
    shirtShoulder: '57 cm',
    shirtSleeve: '25 cm',
  },
]

const SIZE_ORDER: TshirtSizeCode[] = ['S', 'M', 'L', 'XL', 'XXL']

function parseHeightToCm(raw: string): number | null {
  const cleaned = raw.trim().toLowerCase().replace(/\s+/g, '')
  if (!cleaned) return null

  const mMatch = cleaned.match(/^(\d)m(\d{1,2})?$/)
  if (mMatch) {
    const meters = Number(mMatch[1])
    const rest = mMatch[2]
    if (!rest) return null
    const cmPart = rest.length === 1 ? Number(rest) * 10 : Number(rest)
    const total = meters * 100 + cmPart
    return total >= 135 && total <= 220 ? total : null
  }

  const numStr = cleaned.replace(/cm$/, '').replace(',', '.')
  const val = Number(numStr)
  if (!Number.isFinite(val) || val <= 0) return null
  if (val < 3) {
    const total = Math.round(val * 100)
    return total >= 135 && total <= 220 ? total : null
  }
  return val >= 135 && val <= 220 ? Math.round(val) : null
}

function parseMetricNumber(raw: string, min: number, max: number): number | null {
  const cleaned = raw.trim().toLowerCase().replace(/(kg|cm|\s)+/g, '').replace(',', '.')
  if (!cleaned) return null
  const val = Number(cleaned)
  if (!Number.isFinite(val) || val < min || val > max) return null
  return val
}

function recommendTshirtSize(inputs: {
  height: string
  weight: string
  bust: string
  waist: string
  hip: string
}): TshirtSizeCode | null {
  const indices: number[] = []

  const h = parseHeightToCm(inputs.height)
  if (h !== null) {
    if (h <= 163) indices.push(0)
    else if (h <= 172) indices.push(1)
    else if (h <= 178) indices.push(2)
    else if (h <= 184) indices.push(3)
    else indices.push(4)
  }

  const w = parseMetricNumber(inputs.weight, 35, 145)
  if (w !== null) {
    if (w <= 56) indices.push(0)
    else if (w <= 66) indices.push(1)
    else if (w <= 76) indices.push(2)
    else if (w <= 86) indices.push(3)
    else indices.push(4)
  }

  const b = parseMetricNumber(inputs.bust, 65, 145)
  if (b !== null) {
    if (b <= 87) indices.push(0)
    else if (b <= 94) indices.push(1)
    else if (b <= 101) indices.push(2)
    else if (b <= 108) indices.push(3)
    else indices.push(4)
  }

  const wa = parseMetricNumber(inputs.waist, 50, 135)
  if (wa !== null) {
    if (wa <= 71) indices.push(0)
    else if (wa <= 79) indices.push(1)
    else if (wa <= 87) indices.push(2)
    else if (wa <= 95) indices.push(3)
    else indices.push(4)
  }

  const hi = parseMetricNumber(inputs.hip, 70, 145)
  if (hi !== null) {
    if (hi <= 90) indices.push(0)
    else if (hi <= 97) indices.push(1)
    else if (hi <= 104) indices.push(2)
    else if (hi <= 111) indices.push(3)
    else indices.push(4)
  }

  if (indices.length === 0) return null
  const finalIdx = Math.min(SIZE_ORDER.length - 1, Math.max(...indices))
  return SIZE_ORDER[finalIdx]
}

const AI_SAMPLE_PROMPTS = [
  {
    id: 'prompt-cyber-tiger',
    label: 'Mẫu 01 · Streetwear Cyber',
    styleTag: 'Streetwear · Vector Neon',
    prompt:
      'Hổ thần Cyberpunk phong cách Streetwear Nhật Bản, tông xanh Electric Blue và trắng sáng, nét vẽ vector sắc nét, tách nền PNG trong suốt để in ngực áo thun.',
    artworkTitle: 'CYBER TIGER NEO-TOKYO',
    resolution: '1024 × 1024 px · Đã tách nền PNG',
    svgDataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
        <defs>
          <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0011FF"/>
            <stop offset="55%" stop-color="#0077FF"/>
            <stop offset="100%" stop-color="#00E5FF"/>
          </linearGradient>
        </defs>
        <circle cx="256" cy="256" r="200" fill="none" stroke="url(#g1)" stroke-width="10" stroke-dasharray="18 10"/>
        <circle cx="256" cy="256" r="168" fill="#0011FF" fill-opacity="0.92"/>
        <polygon points="256,88 390,175 352,356 160,356 122,175" fill="none" stroke="#00E5FF" stroke-width="6"/>
        <path d="M176 205 L216 165 L256 195 L296 165 L336 205 L316 295 L256 335 L196 295 Z" fill="url(#g1)" stroke="#FFFFFF" stroke-width="6"/>
        <polygon points="205,225 238,235 215,252" fill="#FFFFFF"/>
        <polygon points="307,225 274,235 297,252" fill="#FFFFFF"/>
        <polygon points="240,268 272,268 256,292" fill="#00E5FF"/>
        <path d="M212 308 L256 324 L300 308" fill="none" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round"/>
        <text x="256" y="392" text-anchor="middle" fill="#FFFFFF" font-family="Arial, sans-serif" font-weight="900" font-size="26" letter-spacing="4">ALTERA CYBER</text>
        <text x="256" y="420" text-anchor="middle" fill="#00E5FF" font-family="Arial, sans-serif" font-weight="700" font-size="14" letter-spacing="6">LIMITED EDITION 280GSM</text>
      </svg>
    `)}`,
  },
  {
    id: 'prompt-y2k-astro',
    label: 'Mẫu 02 · Y2K Retro Space',
    styleTag: 'Y2K · Chrome Graphic',
    prompt:
      'Huy hiệu phi hành gia du hành vũ trụ Y2K Retro, vòng quỹ đạo sao Thổ màu xanh coban và tia chớp bạc Chrome, bố cục cân đối in giữa áo thun Boxy.',
    artworkTitle: 'ORBITAL Y2K ODYSSEY',
    resolution: '1024 × 1024 px · Đã tách nền PNG',
    svgDataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
        <defs>
          <linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#00C8FF"/>
            <stop offset="50%" stop-color="#0044FF"/>
            <stop offset="100%" stop-color="#0011AA"/>
          </linearGradient>
        </defs>
        <rect x="66" y="66" width="380" height="380" rx="48" fill="url(#g2)" stroke="#FFFFFF" stroke-width="8"/>
        <ellipse cx="256" cy="240" rx="165" ry="58" transform="rotate(-18 256 240)" fill="none" stroke="#FFFFFF" stroke-width="8"/>
        <circle cx="256" cy="240" r="78" fill="#FFFFFF"/>
        <circle cx="256" cy="232" r="52" fill="#0017FF"/>
        <path d="M225 220 Q256 195 287 220" fill="none" stroke="#00E5FF" stroke-width="6" stroke-linecap="round"/>
        <polygon points="145,130 160,162 192,175 160,188 145,220 130,188 98,175 130,162" fill="#00E5FF"/>
        <polygon points="372,120 382,144 406,154 382,164 372,188 362,164 338,154 362,144" fill="#FFFFFF"/>
        <text x="256" y="378" text-anchor="middle" fill="#FFFFFF" font-family="Arial, sans-serif" font-weight="900" font-size="28" letter-spacing="5">SPACE ODYSSEY</text>
        <text x="256" y="408" text-anchor="middle" fill="#00E5FF" font-family="Arial, sans-serif" font-weight="700" font-size="15" letter-spacing="5">ALTERA STUDIO · Y2K</text>
      </svg>
    `)}`,
  },
  {
    id: 'prompt-viet-archive',
    label: 'Mẫu 03 · Việt Nam Đương Đại',
    styleTag: 'Minimalist · Bản Sắc Việt',
    prompt:
      'Biểu tượng mặt trời Đông Sơn kết hợp sóng nước geometric tối giản, phối màu xanh dương nguyên bản và trắng, phong cách thời trang đương đại.',
    artworkTitle: 'DONG SON GEOMETRIC ARCHIVE',
    resolution: '1024 × 1024 px · Đã tách nền PNG',
    svgDataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
        <circle cx="256" cy="236" r="158" fill="#0011FF" stroke="#00C8FF" stroke-width="8"/>
        <circle cx="256" cy="236" r="118" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-dasharray="10 8"/>
        <polygon points="256,110 278,198 368,198 294,250 320,338 256,286 192,338 218,250 144,198 234,198" fill="#00E5FF" stroke="#FFFFFF" stroke-width="4"/>
        <circle cx="256" cy="236" r="36" fill="#0011FF" stroke="#FFFFFF" stroke-width="5"/>
        <rect x="96" y="382" width="320" height="52" rx="14" fill="#0011FF" stroke="#00C8FF" stroke-width="4"/>
        <text x="256" y="415" text-anchor="middle" fill="#FFFFFF" font-family="Arial, sans-serif" font-weight="900" font-size="22" letter-spacing="5">VIETNAM ARCHIVE</text>
      </svg>
    `)}`,
  },
]

const STUDIO_TUTORIAL_STEPS = [
  {
    step: '01',
    time: '00:00 – 00:15',
    title: 'Chọn Size Áo Thun Trực Tiếp Hoặc Nhập Số Đo Cơ Thể',
    desc: 'ALTERA sử dụng 1 dòng phôi Áo Thun Cotton 280gsm chuẩn form duy nhất. Người dùng có thể bấm chọn trực tiếp từng size S, M, L, XL, XXL để xem thông số đo đạc hoặc nhập chiều cao, cân nặng và số đo 3 vòng để hệ thống tự động chọn size phù hợp.',
    badge: 'Bước 01 · Chọn Size & Số đo 3 vòng',
    highlights: [
      '1 dòng phôi Áo Thun Cotton 280gsm chuẩn form duy nhất',
      'Nhập chiều cao, cân nặng & 3 vòng tự động chọn size S – XXL',
      'Bảng đo đạc chi tiết chiều cao, cân nặng, 3 vòng & số đo áo từng size',
    ],
  },
  {
    step: '02',
    time: '00:15 – 00:35',
    title: 'Tạo Họa Tiết Bằng AI Prompt Hoặc Tải Ảnh & Tách Nền',
    desc: 'Nhập mô tả ý tưởng bằng tiếng Việt vào ô Prompt AI hoặc chọn Prompt mẫu để AI tự động vẽ hình in độc bản, khử nền PNG trong suốt sắc nét sẵn sàng đặt lên áo.',
    badge: 'Bước 02 · AI Prompt & Sinh Hình In',
    highlights: [
      'Ô nhập Prompt AI trực quan kèm gợi ý mẫu có sẵn',
      'Tự động sinh họa tiết & tách nền PNG trong suốt',
      'Đưa thẳng hình AI vừa tạo sang mô hình áo 3D',
    ],
  },
  {
    step: '03',
    time: '00:35 – 00:55',
    title: 'Ướm Thử & Xoay 360° Trên Mô Hình Áo Thun 3D Thực Tế',
    desc: 'Tương tác trực tiếp với mô hình Áo Thun 3D ngay trên trình duyệt: xoay 360 độ mọi góc nhìn, đổi màu vải áo theo thời gian thực và kiểm tra vị trí hình in trước/sau.',
    badge: 'Bước 03 · Mô Hình 3D Tương Tác 360°',
    highlights: [
      'Xoay 360° mô hình Áo Thun 3D trực tiếp bằng chuột/cảm ứng',
      'Đổi màu áo (Trắng, Đen, Navy, Xanh Electric) tức thì',
      'Xem rõ hình in AI áp lên bề mặt nếp vải 3D',
    ],
  },
  {
    step: '04',
    time: '00:55 – 01:15',
    title: 'Đặt Mua Mặc Ngay Hoặc Mở Bán Trên Sàn Marketplace Mini',
    desc: 'Hoàn tất thiết kế để đặt giao tận nhà (VietQR / COD), hoặc đăng bán mẫu áo lên Sàn Marketplace để cộng đồng đặt mua và nhận ngay 5% hoa hồng bản quyền.',
    badge: 'Bước 04 · Marketplace Mini & Mở Bán',
    highlights: [
      'Xem trước gian hàng Marketplace Mini ngay trong khung',
      'Giá bán hợp lý từ 219.000 ₫ – 279.000 ₫/áo',
      'Creator nhận tự động 5% hoa hồng trên mỗi áo bán ra',
    ],
  },
]

const USER_FLOW_STEPS = [
  {
    number: '01',
    title: 'Định Hình Phong Cách & Chọn Size Áo',
    subtitle: 'AI Stylist & Bảng Số Đo Chuẩn',
    description:
      'Trả lời 4 câu hỏi nhanh cùng AI Stylist để nhận bản phối minh họa trực quan phù hợp ngân sách (từ 159.000 ₫), kèm công cụ tính size áo theo chiều cao & cân nặng.',
    ctaLabel: 'Trải nghiệm AI Stylist',
    ctaPath: '/outfit',
    tags: ['Minh họa Outfit trực quan', 'Lọc theo ngân sách', 'Tư vấn chọn Size S–XL'],
  },
  {
    number: '02',
    title: 'Thiết Kế Áo Thun 3D & Tạo Hình AI',
    subtitle: 'Xưởng Thiết Kế 3D Studio Độc Bản',
    description:
      'Chọn phôi áo thun Cotton 280gsm, tự tạo họa tiết bằng AI hoặc tải ảnh cá nhân, tách nền trong suốt và căn chỉnh trực tiếp trên mô hình áo 3D xoay 360°.',
    ctaLabel: 'Mở Xưởng Thiết Kế 3D',
    ctaPath: '/design',
    tags: ['Xoay 3D 360° trực quan', 'AI vẽ hình & Tách nền', 'In DTF / DTG sắc nét'],
  },
  {
    number: '03',
    title: 'Đặt Mua Áo Thun Hoặc Khám Phá Sàn',
    subtitle: 'Thanh Toán Minh Bạch · Giá Hợp Lý',
    description:
      'Đặt mua ngay chiếc áo vừa thiết kế hoặc chọn mua tác phẩm từ cộng đồng Creator trên Marketplace với giá chỉ từ 219.000 ₫. Hỗ trợ VietQR MBBank và COD toàn quốc.',
    ctaLabel: 'Khám phá Marketplace',
    ctaPath: '/marketplace',
    tags: ['Áo thiết kế từ 219.000 ₫', 'Thanh toán VietQR & COD', 'Miễn phí vận chuyển'],
  },
  {
    number: '04',
    title: 'Nâng Cấp Hội Viên & Nhận Hoa Hồng',
    subtitle: 'Kênh Creator Hub & Gói VIP',
    description:
      'Nâng cấp gói Hội viên VIP để mở rộng lượt tạo AI, đăng bán thiết kế lên Marketplace và nhận tiền hoa hồng bản quyền 5% mỗi khi có khách đặt mua áo.',
    ctaLabel: 'Xem Đặc Quyền VIP',
    ctaPath: '/membership',
    tags: ['Mở rộng lượt tạo AI', 'Thương mại hóa thiết kế', 'Thống kê doanh thu Creator'],
  },
]

const SHIRT_DEMO_COLORS = [
  { name: 'Trắng Classic', hex: '#F8FAFC' },
  { name: 'Đen Jet Black', hex: '#18181B' },
  { name: 'Xanh Electric', hex: '#0033FF' },
  { name: 'Xanh Navy', hex: '#1E293B' },
]

export function HomePage() {
  const [trending, setTrending] = useState<MarketplaceDesign[]>([])
  const [activeTutorialIdx, setActiveTutorialIdx] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(false)

  // Interactive states inside the 4 tutorial steps
  const [selectedSizeCode, setSelectedSizeCode] = useState<TshirtSizeCode>('M')
  const [bodyInputs, setBodyInputs] = useState({
    height: '1m70',
    weight: '65',
    bust: '92',
    waist: '76',
    hip: '94',
  })
  const [selectedPromptIdx, setSelectedPromptIdx] = useState(0)
  const [demoShirtColor, setDemoShirtColor] = useState('#F8FAFC')
  const [demoPrintSide, setDemoPrintSide] = useState<'FRONT' | 'BACK'>('FRONT')
  const [demoDecalLocked, setDemoDecalLocked] = useState(true)

  const handleBodyInputChange = (
    field: keyof typeof bodyInputs,
    value: string
  ) => {
    const next = { ...bodyInputs, [field]: value }
    setBodyInputs(next)
    const autoSize = recommendTshirtSize(next)
    if (autoSize) {
      setSelectedSizeCode(autoSize)
    }
  }

  const hasAnyBodyInput = Object.values(bodyInputs).some((v) => v.trim() !== '')
  const recommendedSize = recommendTshirtSize(bodyInputs)
  const currentSizeSpec =
    TSHIRT_SIZE_CHART.find((item) => item.size === selectedSizeCode) ??
    TSHIRT_SIZE_CHART[1]

  useEffect(() => {
    let active = true
    MarketplaceService.list({ sort: 'Best Selling', limit: 8 })
      .then(({ data }) => {
        if (active) setTrending(data.data.designs)
      })
      .catch(() => {
        if (active) setTrending([])
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!isAutoPlaying) return
    const timer = window.setInterval(() => {
      setActiveTutorialIdx((prev) => (prev + 1) % STUDIO_TUTORIAL_STEPS.length)
    }, 6500)
    return () => window.clearInterval(timer)
  }, [isAutoPlaying])

  const currentClip = STUDIO_TUTORIAL_STEPS[activeTutorialIdx]
  const currentPromptSample = AI_SAMPLE_PROMPTS[selectedPromptIdx]

  return (
    <div className="min-h-screen bg-white text-black overflow-hidden font-body selection:bg-[#0011FF] selection:text-white">
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 1 — HERO: ĐỊNH HÌNH RÕ SẢN PHẨM CHÍNH LÀ ÁO THUN 3D & AI
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative min-h-[88vh] flex flex-col justify-center px-6 md:px-12 pt-28 pb-16 overflow-hidden bg-white">
        <div className="w-full max-w-7xl mx-auto flex justify-between items-center mb-6 md:mb-10 font-bold uppercase tracking-widest z-20 relative">
          <img src={logoSvg} alt="ALTERA Logo" className="h-6 md:h-10 w-auto object-contain" />
          <span className="text-[#0011FF] text-[11px] tracking-[0.2em]">
            THƯƠNG HIỆU ÁO THUN THIẾT KẾ 3D &amp; AI
          </span>
        </div>

        <div className="w-full max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-4 items-center">
          <div className="lg:col-span-7 relative z-30">
            <span className="text-[#0011FF] text-xs md:text-sm font-bold uppercase tracking-[0.25em] mb-6 md:mb-8 block">
              ALTERA · ÁO THUN COTTON 280GSM CHỦ ĐẠO
            </span>
            <motion.h1
              className="font-heading text-[clamp(2.35rem,4.7vw,4.5rem)] leading-[1.32] tracking-normal uppercase font-black select-none mt-2"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className="block pt-4 pb-1 mb-2 md:mb-3 bg-gradient-to-r from-[#0011FF] via-blue-500 to-cyan-400 bg-clip-text text-transparent">
                ÁO THUN ĐỘC BẢN
              </span>
              <span className="block pt-3 pb-1 bg-gradient-to-r from-[#0011FF] via-blue-500 to-cyan-400 bg-clip-text text-transparent">
                TỪ Ý TƯỞNG CỦA BẠN
              </span>
            </motion.h1>

            <motion.p
              className="font-rader mt-7 md:mt-9 text-sm md:text-base font-normal leading-relaxed max-w-xl text-blue-950/90 tracking-normal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              ALTERA tập trung chuyên sâu vào <strong>1 dòng phôi Áo Thun Cotton Heavyweight 280gsm Chuẩn Form Unisex duy nhất (Đủ Size S, M, L, XL, XXL)</strong>. Tự tay sáng tạo họa tiết bằng AI, ướm thử trên mô hình 3D xoay 360°, chọn size theo số đo 3 vòng hoặc đặt mua áo thiết kế độc bản chỉ từ <strong className="text-[#0011FF]">179.000 ₫</strong>.
            </motion.p>

            <div className="mt-8 flex flex-wrap gap-3.5">
              <Link
                to="/design"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#0011FF] via-[#0055FF] to-[#0099FF] px-7 py-3.5 text-xs font-bold uppercase tracking-widest text-white transition hover:opacity-95"
              >
                Thiết kế Áo Thun 3D ngay
              </Link>
              <Link
                to="/marketplace"
                className="inline-flex items-center justify-center rounded-xl border-2 border-[#0011FF] bg-white px-7 py-3.5 text-xs font-bold uppercase tracking-widest text-[#0011FF] transition hover:bg-[#0011FF] hover:text-white"
              >
                Khám phá Sàn Áo Thun ({trending.length || '20+'})
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 relative z-20 flex justify-center lg:justify-end">
            <motion.img
              src={homepage0}
              alt="Áo Thun 3D ALTERA"
              className="w-full max-w-[440px] lg:max-w-[520px] h-auto object-contain drop-shadow-[0_30px_60px_rgba(0,17,255,0.18)] select-none transform hover:scale-105 transition-transform duration-500"
              initial={{ opacity: 0, scale: 0.95, x: 30 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>

        {/* 4 Core Highlights of ALTERA's Single Flagship T-Shirt */}
        <div className="w-full max-w-7xl mx-auto mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 relative z-20">
          {TSHIRT_HERO_HIGHLIGHTS.map((item) =>
            item.to.startsWith('#') ? (
              <a
                key={item.code}
                href={item.to}
                onClick={() => {
                  setActiveTutorialIdx(0)
                  setIsAutoPlaying(false)
                }}
                className="group rounded-2xl border border-blue-200 bg-[#F5F9FF] p-5 transition-all hover:-translate-y-1 hover:border-[#0011FF] hover:bg-white hover:shadow-xl hover:shadow-blue-600/10"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-md bg-[#0011FF] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    {item.code} · {item.badge}
                  </span>
                  <span className="text-sm font-black text-[#0011FF]">
                    {item.rightLabel}
                  </span>
                </div>
                <h2 className="mt-3 text-sm font-extrabold tracking-normal text-blue-950 group-hover:text-[#0011FF]">
                  {item.title}
                </h2>
                <p className="mt-1 text-xs text-blue-900/70">{item.spec}</p>
              </a>
            ) : (
              <Link
                key={item.code}
                to={item.to}
                className="group rounded-2xl border border-blue-200 bg-[#F5F9FF] p-5 transition-all hover:-translate-y-1 hover:border-[#0011FF] hover:bg-white hover:shadow-xl hover:shadow-blue-600/10"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-md bg-[#0011FF] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    {item.code} · {item.badge}
                  </span>
                  <span className="text-sm font-black text-[#0011FF]">
                    {item.rightLabel}
                  </span>
                </div>
                <h2 className="mt-3 text-sm font-extrabold tracking-normal text-blue-950 group-hover:text-[#0011FF]">
                  {item.title}
                </h2>
                <p className="mt-1 text-xs text-blue-900/70">{item.spec}</p>
              </Link>
            )
          )}
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 2 — CLIP HƯỚNG DẪN SỬ DỤNG TÍNH NĂNG THIẾT KẾ ÁO THUN 3D & AI
          + Phần 01: 1 Phôi áo duy nhất · Chọn Size hoặc nhập số đo cơ thể & 3 vòng
          + Phần 02: Ô Prompt AI mẫu & Kết quả AI Generate trực quan
          + Phần 03: Mô hình Áo Thun 3D xoay 360° thực tế (ShirtCanvas3D)
          + Phần 04: Gian hàng Marketplace Mini trực quan
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section
        id="clip-huong-dan-thiet-ke"
        className="relative overflow-hidden bg-gradient-to-b from-[#0017FF] via-[#0077FF] to-[#00C8FF] px-6 py-20 text-white md:px-12 md:py-28"
      >
        <div className="mx-auto max-w-7xl relative z-10">
          <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
            <div>
              <span className="inline-block rounded-full border border-white/35 bg-white/15 px-4 py-1 text-xs font-bold uppercase tracking-[0.2em] text-white backdrop-blur-md">
                MÔ PHỎNG TƯƠNG TÁC TRỰC QUAN · STUDIO TUTORIAL
              </span>
              <h2 className="font-heading mt-4 text-3xl font-black uppercase tracking-normal text-white md:text-5xl">
                Hướng Dẫn Thiết Kế Áo Thun 3D &amp; AI Trong 4 Bước
              </h2>
              <p className="font-rader mt-3 max-w-2xl text-sm md:text-base text-white/90 leading-relaxed">
                Bấm vào từng phần bên phải hoặc tương tác trực tiếp ngay trong màn hình mô phỏng bên trái: thử nhập số đo cơ thể để tìm Size áo, chọn Prompt AI mẫu, xoay áo 3D 360° và xem gian hàng Marketplace Mini.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setIsAutoPlaying((v) => !v)}
                className="rounded-xl border border-white/40 bg-white/15 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md transition hover:bg-white hover:text-[#0011FF]"
              >
                {isAutoPlaying ? 'Tạm dừng chuyển cảnh' : 'Phát tự động 4 bước'}
              </button>
              <Link
                to="/design"
                className="rounded-xl bg-white px-6 py-3 text-xs font-extrabold uppercase tracking-wider text-[#0011FF] transition hover:bg-blue-50"
              >
                Thực hành ngay tại Studio
              </Link>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.38fr_1fr] items-stretch">
            {/* Left: Interactive Studio Walkthrough Viewport */}
            <div className="relative flex flex-col justify-between overflow-hidden rounded-[26px] border border-white/35 bg-white/10 backdrop-blur-md shadow-2xl">
              {/* Top Studio Window Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/20 bg-[#0011FF]/55 px-5 py-3.5">
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  ALTERA 3D STUDIO · PHẦN {currentClip.step}/04 ({currentClip.time})
                </span>
                <span className="rounded-md bg-white px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#0011FF]">
                  {currentClip.badge}
                </span>
              </div>

              {/* Main Interactive Viewport Content (Changes per step 01 / 02 / 03 / 04) */}
              <div className="relative min-h-[430px] md:min-h-[460px] w-full overflow-hidden bg-white text-blue-950 flex flex-col justify-between p-5 md:p-6">
                {/* ── VIEWPORT PHẦN 01: 1 LOẠI ÁO DUY NHẤT · CHỌN SIZE HOẶC NHẬP SỐ ĐO CƠ THỂ & 3 VÒNG ── */}
                {activeTutorialIdx === 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch my-auto">
                    {/* Left: Single Flagship T-Shirt Card */}
                    <div className="md:col-span-4 flex flex-col items-center justify-between rounded-2xl bg-[#F4F8FF] border border-blue-200 p-4 relative">
                      <div className="flex w-full items-center justify-between gap-1.5">
                        <span className="rounded-md bg-[#0011FF] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white">
                          {ALTERA_SINGLE_SHIRT.badge}
                        </span>
                        <span className="rounded-md border border-[#0011FF] bg-white px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#0011FF]">
                          SIZE {selectedSizeCode}
                        </span>
                      </div>

                      <img
                        src={homepage0}
                        alt={ALTERA_SINGLE_SHIRT.name}
                        className="my-2 h-40 md:h-48 w-auto object-contain drop-shadow-[0_18px_30px_rgba(0,17,255,0.18)]"
                      />

                      <div className="w-full rounded-xl border border-blue-100 bg-white p-2.5 text-center">
                        <p className="text-xs font-extrabold tracking-normal text-blue-950">
                          {ALTERA_SINGLE_SHIRT.name}
                        </p>
                        <p className="mt-0.5 text-[11px] text-blue-900/70">
                          {ALTERA_SINGLE_SHIRT.spec}
                        </p>
                        <p className="mt-1.5 text-xs font-black uppercase text-[#0011FF]">
                          Giá phôi: {formatVND(ALTERA_SINGLE_SHIRT.price)}
                        </p>
                      </div>
                    </div>

                    {/* Right: Direct Size Picker + Body Measurements Input + Per-Size Detailed Measurements */}
                    <div className="md:col-span-8 flex flex-col justify-between space-y-3">
                      {/* 1. Direct Size Buttons (S, M, L, XL, XXL) */}
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#0011FF]">
                            BƯỚC 01 · CHỌN SIZE ÁO THUN (1 DÒNG PHÔI DUY NHẤT)
                          </p>
                          <span className="text-[11px] font-bold text-blue-900/70">
                            Click chọn Size hoặc nhập số đo bên dưới
                          </span>
                        </div>

                        <div className="mt-2 grid grid-cols-5 gap-1.5 sm:gap-2">
                          {TSHIRT_SIZE_CHART.map((item) => {
                            const isSelected = item.size === selectedSizeCode
                            const isRecommended = recommendedSize === item.size
                            return (
                              <button
                                key={item.size}
                                type="button"
                                onClick={() => setSelectedSizeCode(item.size)}
                                className={`relative rounded-xl border px-2 py-2 text-center transition-all ${
                                  isSelected
                                    ? 'border-[#0011FF] bg-[#0011FF] text-white shadow-md shadow-blue-600/20'
                                    : 'border-blue-200 bg-[#F5F9FF] text-blue-950 hover:border-[#0011FF]'
                                }`}
                              >
                                <div className="flex items-center justify-center gap-1">
                                  <span className="text-xs sm:text-sm font-black tracking-normal">
                                    Size {item.size}
                                  </span>
                                </div>
                                <p
                                  className={`mt-0.5 text-[10px] font-semibold ${
                                    isSelected ? 'text-white/90' : 'text-blue-900/70'
                                  }`}
                                >
                                  {item.weightRange}
                                </p>
                                {isRecommended && (
                                  <span
                                    className={`mt-1 inline-block rounded px-1.5 py-0.2 text-[9px] font-extrabold uppercase ${
                                      isSelected
                                        ? 'bg-white text-[#0011FF]'
                                        : 'bg-[#0011FF]/10 text-[#0011FF]'
                                    }`}
                                  >
                                    Phù hợp
                                  </span>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* 2. Body Measurements Calculator (Height, Weight & 3 Vòng) */}
                      <div className="rounded-xl border border-blue-200 bg-[#F4F8FF] p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0011FF]">
                            NHẬP SỐ LIỆU CƠ THỂ ĐỂ TỰ ĐỘNG CHỌN SIZE
                          </span>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {recommendedSize ? (
                              <button
                                type="button"
                                onClick={() => setSelectedSizeCode(recommendedSize)}
                                className="rounded-md bg-[#0011FF] px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-white transition hover:bg-blue-700"
                              >
                                Đề xuất phù hợp: Size {recommendedSize}
                              </button>
                            ) : (
                              <span className="text-[10px] font-bold text-blue-900/65">
                                Nhập chiều cao / cân nặng / 3 vòng
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                if (hasAnyBodyInput) {
                                  setBodyInputs({
                                    height: '',
                                    weight: '',
                                    bust: '',
                                    waist: '',
                                    hip: '',
                                  })
                                } else {
                                  const sample = {
                                    height: '1m70',
                                    weight: '65',
                                    bust: '92',
                                    waist: '76',
                                    hip: '94',
                                  }
                                  setBodyInputs(sample)
                                  setSelectedSizeCode('M')
                                }
                              }}
                              className="rounded-md border border-blue-200 bg-white px-2 py-0.5 text-[10px] font-bold text-[#0011FF] transition hover:border-[#0011FF]"
                            >
                              {hasAnyBodyInput ? 'Xóa để tự nhập' : 'Điền mẫu 1m70 · 65kg'}
                            </button>
                          </div>
                        </div>

                        <div className="mt-2 grid grid-cols-2 sm:grid-cols-5 gap-2">
                          <label className="block">
                            <span className="block text-[10px] font-bold text-blue-900/75">
                              Chiều cao
                            </span>
                            <input
                              type="text"
                              inputMode="text"
                              value={bodyInputs.height}
                              onFocus={(e) => e.currentTarget.select()}
                              onChange={(e) => handleBodyInputChange('height', e.target.value)}
                              placeholder="VD: 1m70"
                              className="mt-0.5 w-full rounded-lg border border-blue-200 bg-white px-2.5 py-1.5 text-xs font-extrabold text-blue-950 placeholder:font-normal placeholder:text-blue-900/35 focus:border-[#0011FF] focus:outline-none"
                            />
                          </label>

                          <label className="block">
                            <span className="block text-[10px] font-bold text-blue-900/75">
                              Cân nặng (kg)
                            </span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={bodyInputs.weight}
                              onFocus={(e) => e.currentTarget.select()}
                              onChange={(e) => handleBodyInputChange('weight', e.target.value)}
                              placeholder="VD: 65"
                              className="mt-0.5 w-full rounded-lg border border-blue-200 bg-white px-2.5 py-1.5 text-xs font-extrabold text-blue-950 placeholder:font-normal placeholder:text-blue-900/35 focus:border-[#0011FF] focus:outline-none"
                            />
                          </label>

                          <label className="block">
                            <span className="block text-[10px] font-bold text-blue-900/75">
                              Vòng 1 · Ngực
                            </span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={bodyInputs.bust}
                              onFocus={(e) => e.currentTarget.select()}
                              onChange={(e) => handleBodyInputChange('bust', e.target.value)}
                              placeholder="VD: 92 cm"
                              className="mt-0.5 w-full rounded-lg border border-blue-200 bg-white px-2.5 py-1.5 text-xs font-extrabold text-blue-950 placeholder:font-normal placeholder:text-blue-900/35 focus:border-[#0011FF] focus:outline-none"
                            />
                          </label>

                          <label className="block">
                            <span className="block text-[10px] font-bold text-blue-900/75">
                              Vòng 2 · Eo
                            </span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={bodyInputs.waist}
                              onFocus={(e) => e.currentTarget.select()}
                              onChange={(e) => handleBodyInputChange('waist', e.target.value)}
                              placeholder="VD: 76 cm"
                              className="mt-0.5 w-full rounded-lg border border-blue-200 bg-white px-2.5 py-1.5 text-xs font-extrabold text-blue-950 placeholder:font-normal placeholder:text-blue-900/35 focus:border-[#0011FF] focus:outline-none"
                            />
                          </label>

                          <label className="col-span-2 sm:col-span-1 block">
                            <span className="block text-[10px] font-bold text-blue-900/75">
                              Vòng 3 · Hông
                            </span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={bodyInputs.hip}
                              onFocus={(e) => e.currentTarget.select()}
                              onChange={(e) => handleBodyInputChange('hip', e.target.value)}
                              placeholder="VD: 94 cm"
                              className="mt-0.5 w-full rounded-lg border border-blue-200 bg-white px-2.5 py-1.5 text-xs font-extrabold text-blue-950 placeholder:font-normal placeholder:text-blue-900/35 focus:border-[#0011FF] focus:outline-none"
                            />
                          </label>
                        </div>
                      </div>

                      {/* 3. Detailed Per-Size Measurements (Height, Weight, 3 Vòng & Garment Dimensions) */}
                      <div className="rounded-xl border-2 border-[#0011FF]/25 bg-white p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0011FF]">
                            THÔNG SỐ ĐO ĐẠC CHUẨN · SIZE {currentSizeSpec.size} ({currentSizeSpec.badge})
                          </span>
                          <span className="rounded-md bg-[#EEF4FF] px-2.5 py-0.5 text-[10px] font-extrabold text-[#0011FF]">
                            {currentSizeSpec.typicalNote}
                          </span>
                        </div>

                        <div className="mt-2 grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-center">
                          <div className="rounded-lg bg-[#F4F8FF] p-2 border border-blue-100">
                            <p className="text-[10px] font-bold uppercase text-blue-900/65">
                              Chiều cao
                            </p>
                            <p className="mt-0.5 text-xs font-black text-[#0011FF]">
                              {currentSizeSpec.heightRange}
                            </p>
                          </div>

                          <div className="rounded-lg bg-[#F4F8FF] p-2 border border-blue-100">
                            <p className="text-[10px] font-bold uppercase text-blue-900/65">
                              Cân nặng
                            </p>
                            <p className="mt-0.5 text-xs font-black text-[#0011FF]">
                              {currentSizeSpec.weightRange}
                            </p>
                          </div>

                          <div className="rounded-lg bg-[#F4F8FF] p-2 border border-blue-100">
                            <p className="text-[10px] font-bold uppercase text-blue-900/65">
                              Vòng 1 (Ngực)
                            </p>
                            <p className="mt-0.5 text-xs font-black text-[#0011FF]">
                              {currentSizeSpec.bustRange}
                            </p>
                          </div>

                          <div className="rounded-lg bg-[#F4F8FF] p-2 border border-blue-100">
                            <p className="text-[10px] font-bold uppercase text-blue-900/65">
                              Vòng 2 (Eo)
                            </p>
                            <p className="mt-0.5 text-xs font-black text-[#0011FF]">
                              {currentSizeSpec.waistRange}
                            </p>
                          </div>

                          <div className="col-span-2 sm:col-span-1 rounded-lg bg-[#F4F8FF] p-2 border border-blue-100">
                            <p className="text-[10px] font-bold uppercase text-blue-900/65">
                              Vòng 3 (Hông)
                            </p>
                            <p className="mt-0.5 text-xs font-black text-[#0011FF]">
                              {currentSizeSpec.hipRange}
                            </p>
                          </div>
                        </div>

                        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-1.5 border-t border-blue-100 pt-2 text-[11px]">
                          <span className="font-bold text-blue-900/75">
                            Số đo áo thực tế (Size {currentSizeSpec.size}):
                          </span>
                          <span className="font-extrabold text-[#0011FF]">
                            Rộng ngực áo {currentSizeSpec.shirtChest} · Dài áo {currentSizeSpec.shirtLength} · Vai {currentSizeSpec.shirtShoulder} · Dài tay {currentSizeSpec.shirtSleeve}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── VIEWPORT PHẦN 02: AI PROMPT MẪU & KẾT QUẢ AI GENERATE TRỰC QUAN ── */}
                {activeTutorialIdx === 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch my-auto">
                    {/* Left column inside viewport: Prompt Box & Sample Prompts */}
                    <div className="md:col-span-7 flex flex-col justify-between rounded-2xl border border-blue-200 bg-[#F4F8FF] p-4 md:p-5">
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="rounded-md bg-[#0011FF] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white">
                            AI GRAPHIC GENERATOR · PROMPT TRỰC QUAN
                          </span>
                          <span className="text-[11px] font-bold text-[#0011FF]">
                            {currentPromptSample.styleTag}
                          </span>
                        </div>

                        <p className="mt-3 text-xs font-bold uppercase tracking-wider text-blue-900/70">
                          Chọn thử 1 trong 3 Prompt mẫu bên dưới:
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {AI_SAMPLE_PROMPTS.map((sample, idx) => (
                            <button
                              key={sample.id}
                              type="button"
                              onClick={() => setSelectedPromptIdx(idx)}
                              className={`rounded-lg px-3 py-1.5 text-xs font-extrabold transition ${
                                idx === selectedPromptIdx
                                  ? 'bg-[#0011FF] text-white'
                                  : 'bg-white text-[#0011FF] border border-blue-200 hover:border-[#0011FF]'
                              }`}
                            >
                              {sample.label}
                            </button>
                          ))}
                        </div>

                        {/* Simulated Prompt Textarea */}
                        <div className="mt-3.5 rounded-xl border-2 border-[#0011FF] bg-white p-3.5">
                          <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0011FF]">
                              NỘI DUNG PROMPT MÔ TẢ CHO AI
                            </span>
                            <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#0011FF]">
                              Tiếng Việt · Tự động tối ưu
                            </span>
                          </div>
                          <p className="mt-2.5 text-xs md:text-sm font-semibold leading-relaxed text-blue-950">
                            &ldquo;{currentPromptSample.prompt}&rdquo;
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-blue-200/80">
                        <span className="text-[11px] font-bold text-blue-900/75">
                          Chế độ: Khử nền PNG trong suốt tự động
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTutorialIdx(2)
                            setIsAutoPlaying(false)
                          }}
                          className="rounded-xl bg-gradient-to-r from-[#0011FF] to-[#008DFF] px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-white transition hover:opacity-95"
                        >
                          Ướm thử hình AI này lên Áo 3D (Qua Phần 03)
                        </button>
                      </div>
                    </div>

                    {/* Right column inside viewport: Generated AI Artwork Output */}
                    <div className="md:col-span-5 flex flex-col justify-between rounded-2xl border-2 border-[#0011FF] bg-white p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0011FF]">
                          KẾT QUẢ AI GENERATE
                        </span>
                        <span className="rounded-md bg-[#EEF4FF] px-2 py-0.5 text-[10px] font-bold text-[#0011FF]">
                          Hoàn tất 1.8s
                        </span>
                      </div>

                      {/* Transparent Checkerboard Preview Box */}
                      <div
                        className="my-3 flex aspect-square w-full max-h-[220px] mx-auto items-center justify-center rounded-xl border border-blue-200 p-3"
                        style={{
                          backgroundImage:
                            'linear-gradient(45deg, #EEF4FF 25%, transparent 25%), linear-gradient(-45deg, #EEF4FF 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #EEF4FF 75%), linear-gradient(-45deg, transparent 75%, #EEF4FF 75%)',
                          backgroundSize: '16px 16px',
                          backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
                        }}
                      >
                        <img
                          src={currentPromptSample.svgDataUrl}
                          alt={currentPromptSample.artworkTitle}
                          className="h-full w-full object-contain drop-shadow-md transition-transform duration-300 hover:scale-105"
                        />
                      </div>

                      <div className="rounded-xl bg-[#F4F8FF] p-2.5 text-center border border-blue-100">
                        <p className="text-xs font-black uppercase text-[#0011FF]">
                          {currentPromptSample.artworkTitle}
                        </p>
                        <p className="mt-0.5 text-[11px] font-semibold text-blue-900/75">
                          {currentPromptSample.resolution}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── VIEWPORT PHẦN 03: MÔ HÌNH ÁO THUN 3D TƯƠNG TÁC 360° THỰC TẾ ── */}
                {activeTutorialIdx === 2 && (
                  <div className="flex flex-col h-full justify-between space-y-3">
                    {/* Interactive 3D Controls Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-200 bg-[#F4F8FF] px-3.5 py-2.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0011FF] mr-1">
                          MÀU ÁO 3D:
                        </span>
                        {SHIRT_DEMO_COLORS.map((c) => (
                          <button
                            key={c.hex}
                            type="button"
                            onClick={() => setDemoShirtColor(c.hex)}
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-bold transition ${
                              demoShirtColor === c.hex
                                ? 'border-[#0011FF] bg-[#0011FF] text-white'
                                : 'border-blue-200 bg-white text-blue-950 hover:border-[#0011FF]'
                            }`}
                          >
                            <span
                              className="h-3 w-3 rounded-full border border-black/20"
                              style={{ backgroundColor: c.hex }}
                            />
                            <span>{c.name}</span>
                          </button>
                        ))}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setDemoDecalLocked((v) => !v)}
                          className={`rounded-lg px-3 py-1 text-[11px] font-extrabold uppercase transition ${
                            demoDecalLocked
                              ? 'bg-[#0011FF] text-white'
                              : 'bg-white text-[#0011FF] border-2 border-[#0011FF]'
                          }`}
                        >
                          {demoDecalLocked
                            ? 'Đang Khóa Nhãn Dán · Xoay Áo 360°'
                            : 'Mở Khóa Nhãn Dán · Kéo Hình In'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDemoPrintSide('FRONT')}
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-extrabold uppercase ${
                            demoPrintSide === 'FRONT'
                              ? 'bg-[#0011FF] text-white'
                              : 'bg-white text-[#0011FF] border border-blue-200'
                          }`}
                        >
                          Mặt trước
                        </button>
                        <button
                          type="button"
                          onClick={() => setDemoPrintSide('BACK')}
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-extrabold uppercase ${
                            demoPrintSide === 'BACK'
                              ? 'bg-[#0011FF] text-white'
                              : 'bg-white text-[#0011FF] border border-blue-200'
                          }`}
                        >
                          Mặt sau
                        </button>
                      </div>
                    </div>

                    {/* Live 3D WebGL Canvas (ShirtCanvas3D) — Full height so bottom hem is never cut off */}
                    <div className="relative h-[415px] md:h-[435px] w-full overflow-hidden rounded-2xl border-2 border-[#0011FF]/25 bg-gradient-to-b from-[#EEF4FF] to-white">
                      <ShirtCanvas3D
                        shirtColor={demoShirtColor}
                        designImage={currentPromptSample.svgDataUrl}
                        printSide={demoPrintSide}
                        decalScale={[0.24, 0.24, 0.24]}
                        decalLocked={demoDecalLocked}
                      />
                      <div className="pointer-events-none absolute top-3 left-3 rounded-lg bg-white/90 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#0011FF] border border-blue-200">
                        {demoDecalLocked
                          ? 'Chế độ Xoay Áo 3D 360° (Giữ chuột trái trên áo để xoay)'
                          : 'Chế độ Kéo Hình In (Giữ chuột trái trên áo để di chuyển nhãn dán)'}
                      </div>
                      <div className="pointer-events-none absolute top-3 right-3 rounded-lg bg-[#0011FF] px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white">
                        Mẫu AI: {currentPromptSample.artworkTitle}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── VIEWPORT PHẦN 04: MARKETPLACE MINI TRỰC QUAN ── */}
                {activeTutorialIdx === 3 && (
                  <div className="flex flex-col justify-between h-full space-y-4 my-auto">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-200 pb-3">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0011FF]">
                          SÀN GIAO DỊCH ÁO THUN · MARKETPLACE MINI
                        </span>
                        <h4 className="text-base md:text-lg font-black text-blue-950 tracking-normal">
                          Đặt Mua Ngay Hoặc Mở Bán Thiết Kế Nhận Hoa Hồng 5%
                        </h4>
                      </div>
                      <Link
                        to="/marketplace"
                        className="rounded-xl bg-[#0011FF] px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-white transition hover:bg-blue-700"
                      >
                        Mở toàn bộ Marketplace
                      </Link>
                    </div>

                    {/* Mini Grid of 3 Marketplace Products */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      {(trending.length ? trending.slice(0, 3) : []).map((design) => {
                        const royalty = Math.round((design.price || 249000) * 0.05)
                        return (
                          <Link
                            key={design._id}
                            to={`/design/${design.slug}`}
                            className="group flex flex-col justify-between rounded-2xl border border-blue-200 bg-[#F4F8FF] p-3 transition hover:-translate-y-1 hover:border-[#0011FF] hover:bg-white hover:shadow-lg"
                          >
                            <div>
                              <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-white p-2">
                                <img
                                  src={optimizeCloudinaryUrl(design.thumbnail, 400)}
                                  alt={design.name}
                                  className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                                />
                                <span className="absolute top-2 left-2 rounded bg-[#0011FF] px-2 py-0.5 text-[9px] font-extrabold uppercase text-white">
                                  Hoa hồng +5%
                                </span>
                              </div>
                              <h5 className="mt-2.5 truncate text-xs font-extrabold text-blue-950 group-hover:text-[#0011FF]">
                                {design.name}
                              </h5>
                              <p className="mt-0.5 truncate text-[11px] text-blue-900/70">
                                Creator: {design.designerId?.displayName || 'ALTERA Creator'}
                              </p>
                            </div>

                            <div className="mt-2.5 border-t border-blue-200/70 pt-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-[#0011FF]">
                                  {formatVND(design.price)}
                                </span>
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                  +{formatVND(royalty)}/áo
                                </span>
                              </div>
                            </div>
                          </Link>
                        )
                      })}

                      {trending.length === 0 &&
                        AI_SAMPLE_PROMPTS.map((fallback) => (
                          <Link
                            key={fallback.id}
                            to="/marketplace"
                            className="group flex flex-col justify-between rounded-2xl border border-blue-200 bg-[#F4F8FF] p-3 transition hover:border-[#0011FF] hover:bg-white"
                          >
                            <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-white p-3 flex items-center justify-center">
                              <img
                                src={fallback.svgDataUrl || homepage0}
                                alt={fallback.artworkTitle}
                                className="h-full w-full object-contain"
                              />
                              <span className="absolute top-2 left-2 rounded bg-[#0011FF] px-2 py-0.5 text-[9px] font-extrabold uppercase text-white">
                                Hoa hồng +5%
                              </span>
                            </div>
                            <h5 className="mt-2.5 truncate text-xs font-extrabold text-blue-950">
                              Áo Thun 280gsm · {fallback.artworkTitle}
                            </h5>
                            <div className="mt-2 flex items-center justify-between border-t border-blue-200/70 pt-2">
                              <span className="text-xs font-black text-[#0011FF]">
                                {formatVND(239000)}
                              </span>
                              <span className="text-[10px] font-bold text-[#0011FF]">
                                Mua ngay
                              </span>
                            </div>
                          </Link>
                        ))}
                    </div>

                    {/* Creator Revenue & Checkout Callout Footer inside Mini Marketplace */}
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#EEF4FF] border border-blue-200 px-4 py-2.5 text-xs">
                      <span className="font-bold text-blue-950">
                        Thanh toán: <strong>VietQR MBBank</strong> hoặc <strong>COD toàn quốc</strong>
                      </span>
                      <span className="font-extrabold text-[#0011FF]">
                        Creator nhận tự động 5% doanh thu mỗi đơn áo thành công
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Player Progress & Caption Footer */}
              <div className="border-t border-white/20 bg-[#0011FF]/45 p-5 md:p-6">
                <div className="mb-4 grid grid-cols-4 gap-2.5">
                  {STUDIO_TUTORIAL_STEPS.map((s, idx) => (
                    <button
                      key={s.step}
                      type="button"
                      onClick={() => {
                        setActiveTutorialIdx(idx)
                        setIsAutoPlaying(false)
                      }}
                      className="group text-left"
                    >
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/25">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            idx === activeTutorialIdx
                              ? 'w-full bg-white'
                              : idx < activeTutorialIdx
                                ? 'w-full bg-white/70'
                                : 'w-0'
                          }`}
                        />
                      </div>
                      <p
                        className={`mt-1.5 text-[11px] font-bold uppercase ${
                          idx === activeTutorialIdx ? 'text-white' : 'text-white/70'
                        }`}
                      >
                        Phần {s.step} · {s.time}
                      </p>
                    </button>
                  ))}
                </div>

                <h3 className="text-lg md:text-xl font-extrabold tracking-normal text-white">
                  {currentClip.title}
                </h3>
                <p className="mt-1.5 text-xs md:text-sm leading-relaxed text-white/90">
                  {currentClip.desc}
                </p>
              </div>
            </div>

            {/* Right: Step-by-Step Interactive Playlist (Zero icons) */}
            <div className="flex flex-col justify-between space-y-3.5">
              {STUDIO_TUTORIAL_STEPS.map((item, idx) => {
                const active = idx === activeTutorialIdx
                return (
                  <button
                    key={item.step}
                    type="button"
                    onClick={() => {
                      setActiveTutorialIdx(idx)
                      setIsAutoPlaying(false)
                    }}
                    className={`w-full rounded-[22px] border p-5 text-left transition-all ${
                      active
                        ? 'border-white bg-white text-blue-950 shadow-2xl scale-[1.01]'
                        : 'border-white/30 bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-block rounded-md px-3 py-1 text-xs font-black uppercase tracking-wider ${
                          active
                            ? 'bg-[#0011FF] text-white'
                            : 'bg-white/20 text-white'
                        }`}
                      >
                        PHẦN {item.step}
                      </span>
                      <span
                        className={`font-mono text-xs font-bold ${
                          active ? 'text-[#0011FF]' : 'text-white/80'
                        }`}
                      >
                        {item.time}
                      </span>
                    </div>

                    <h3
                      className={`mt-3 text-sm sm:text-base font-extrabold tracking-normal ${
                        active ? 'text-[#0011FF]' : 'text-white'
                      }`}
                    >
                      {item.title}
                    </h3>

                    <ul className="mt-2.5 space-y-1.5">
                      {item.highlights.map((h) => (
                        <li
                          key={h}
                          className={`flex items-center gap-2.5 text-xs ${
                            active ? 'text-blue-950/85 font-medium' : 'text-white/90'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                              active ? 'bg-[#0011FF]' : 'bg-white'
                            }`}
                          />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 3 — BEST-SELLING MARKETPLACE T-SHIRTS
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="bg-white px-6 py-20 md:px-12 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b-2 border-[#0011FF]/15 pb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0011FF]">
                SẢN PHẨM CHỦ LỰC · ÁO THUN MARKETPLACE
              </p>
              <h2 className="font-heading mt-2 text-3xl font-black uppercase tracking-normal text-blue-950 md:text-5xl">
                Bộ Sưu Tập Áo Thun Thiết Kế Bán Chạy Nhất
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/products"
                className="rounded-xl border border-[#0011FF]/30 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-[#0011FF] transition hover:bg-[#EEF4FF]"
              >
                Xem kho phôi áo trơn
              </Link>
              <Link
                to="/marketplace"
                className="rounded-xl bg-[#0011FF] px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-blue-700"
              >
                Xem toàn bộ Marketplace
              </Link>
            </div>
          </div>

          {trending.length ? (
            <div className="grid grid-cols-2 gap-5 md:grid-cols-4 md:gap-6">
              {trending.slice(0, 8).map((design) => (
                <Link
                  to={`/design/${design.slug}`}
                  key={design._id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-blue-200 bg-[#F6F9FF] p-3.5 transition-all hover:-translate-y-1 hover:border-[#0011FF] hover:bg-white hover:shadow-xl hover:shadow-blue-600/10"
                >
                  <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-white">
                    <img
                      src={optimizeCloudinaryUrl(design.thumbnail, 600)}
                      alt={design.name}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute top-2.5 left-2.5 rounded-md bg-[#0011FF] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                      {design.category || 'Áo Thun 3D'}
                    </span>
                  </div>
                  <div className="mt-3.5 flex flex-1 flex-col justify-between px-1">
                    <div>
                      <h3 className="truncate text-sm font-extrabold tracking-normal text-blue-950 group-hover:text-[#0011FF]">
                        {design.name}
                      </h3>
                      <p className="mt-1 text-xs text-blue-900/65">
                        Creator: {design.designerId?.displayName || 'ALTERA Studio'}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-blue-200/70 pt-2.5">
                      <span className="text-sm font-black text-[#0011FF]">
                        {formatVND(design.price)}
                      </span>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900/70 group-hover:text-[#0011FF]">
                        Chọn size
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-blue-200 bg-[#F5F9FF] py-14 text-center text-sm text-blue-950/70">
              <p>Chưa có thiết kế được duyệt.</p>
              <Link
                to="/design"
                className="mt-3 inline-block font-bold text-[#0011FF] underline"
              >
                Tạo thiết kế áo thun đầu tiên
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 4 — TIÊU CHUẨN CHẤT LƯỢNG ÁO THUN ALTERA (3D SHIRT CALLOUTS - KHÔNG ICON)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="bg-gradient-to-b from-[#0011FF] via-[#0055FF] to-[#00C8FF] text-white py-20 md:py-28 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="border-t-4 border-white pt-8 mb-14">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              <div className="md:col-span-3 flex items-center">
                <span className="font-heading text-3xl md:text-4xl font-black tracking-normal text-white">
                  ALTERA
                </span>
              </div>
              <div className="md:col-span-3">
                <p className="text-xs uppercase font-bold tracking-[0.2em] text-white/90 leading-relaxed">
                  TIÊU CHUẨN CHẤT LƯỢNG<br />ÁO THUN CHỦ ĐẠO
                </p>
              </div>
              <div className="md:col-span-6">
                <p className="font-rader text-sm md:text-base tracking-normal text-white leading-relaxed font-normal max-w-xl">
                  Tại <strong>ALTERA</strong>, chiếc áo thun không chỉ là trang phục hàng ngày mà là tấm toan nghệ thuật. Chúng tôi kết hợp vải Cotton 280gsm thượng hạng với công nghệ mô phỏng 3D và in kỹ thuật số DTF/DTG sắc nét.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_1.25fr_1fr] items-center">
            <div className="space-y-5">
              <div className="rounded-[22px] border border-white/30 bg-white/10 p-6 backdrop-blur-md">
                <span className="inline-block rounded-md bg-white px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-[#0011FF]">
                  01 · CHẤT LIỆU COTTON 280GSM
                </span>
                <h3 className="mt-3 text-base md:text-lg font-extrabold tracking-normal text-white">
                  Đứng Form Boxy &amp; Chống Bai Gião Cổ Áo
                </h3>
                <p className="mt-2 text-xs md:text-sm leading-relaxed text-white/90">
                  Dệt từ 100% sợi Cotton tự nhiên định lượng dày dặn 240gsm – 280gsm, bo cổ dệt rib 2.8cm chống giãn sau nhiều lần giặt.
                </p>
              </div>

              <div className="rounded-[22px] border border-white/30 bg-white/10 p-6 backdrop-blur-md">
                <span className="inline-block rounded-md bg-white px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-[#0011FF]">
                  02 · CÔNG NGHỆ IN DTF &amp; DTG
                </span>
                <h3 className="mt-3 text-base md:text-lg font-extrabold tracking-normal text-white">
                  Màu In Rực Rỡ, Mềm Mại &amp; Không Bong Tróc
                </h3>
                <p className="mt-2 text-xs md:text-sm leading-relaxed text-white/90">
                  Tùy chọn in màng nhiệt DTF sắc nét (+40.000 ₫) hoặc in phun trực tiếp DTG thấm sâu vào sợi vải (+60.000 ₫) trên cả mặt trước và mặt sau.
                </p>
              </div>
            </div>

            <div className="relative flex justify-center items-center py-6">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.28),transparent_68%)] pointer-events-none" />
              <img
                src={homepage0}
                alt="Mô hình Áo Thun 3D ALTERA"
                className="max-h-[440px] w-auto object-contain relative z-10 drop-shadow-[0_25px_50px_rgba(0,0,0,0.35)]"
              />
            </div>

            <div className="space-y-5">
              <div className="rounded-[22px] border border-white/30 bg-white/10 p-6 backdrop-blur-md">
                <span className="inline-block rounded-md bg-white px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-[#0011FF]">
                  03 · MÔ PHỎNG 3D XOAY 360°
                </span>
                <h3 className="mt-3 text-base md:text-lg font-extrabold tracking-normal text-white">
                  Căn Chỉnh Chính Xác Từng Milimet Trên Áo
                </h3>
                <p className="mt-2 text-xs md:text-sm leading-relaxed text-white/90">
                  Kiểm tra tỷ lệ graphic trên ngực áo và lưng áo ở mọi góc nhìn trước khi đặt in, loại bỏ hoàn toàn rủi ro lệch hình.
                </p>
              </div>

              <div className="rounded-[22px] border border-white/30 bg-white/10 p-6 backdrop-blur-md">
                <span className="inline-block rounded-md bg-white px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-[#0011FF]">
                  04 · BẢNG SỐ ĐO CHUẨN DÁNG VIỆT
                </span>
                <h3 className="mt-3 text-base md:text-lg font-extrabold tracking-normal text-white">
                  Đầy Đủ Size S, M, L, XL, XXL Cho Nam &amp; Nữ
                </h3>
                <p className="mt-2 text-xs md:text-sm leading-relaxed text-white/90">
                  Tích hợp công cụ gợi ý size tự động theo chiều cao (1m53 – 1m92), cân nặng (45 – 98 kg) và số đo 3 vòng chi tiết cho từng size.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 5 — USER FLOW 4 BƯỚC (PHONG CÁCH PROCESS CARD ELECTRIC BLUE, KHÔNG ICON)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="bg-white py-24 md:py-32 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#0011FF]">
                HÀNH TRÌNH KHÁCH HÀNG &amp; NHÀ THIẾT KẾ · USER FLOW
              </p>
              <h2 className="font-heading mt-3 text-[clamp(2.4rem,6vw,5rem)] font-black uppercase tracking-normal text-[#0011FF] leading-[0.98] max-w-3xl">
                4 BƯỚC TRẢI NGHIỆM KHÉP KÍN TẠI ALTERA
              </h2>
            </div>
            <p className="font-rader max-w-md text-sm md:text-base text-blue-950/85 leading-relaxed">
              Từ lúc tìm kiếm ý tưởng phối đồ cùng AI đến khi cầm trên tay chiếc áo thun độc bản hoặc nhận hoa hồng bán áo trên Marketplace.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {USER_FLOW_STEPS.map((flow) => (
              <article
                key={flow.number}
                className="group flex flex-col justify-between rounded-[26px] bg-gradient-to-b from-[#0011FF] via-[#0066FF] to-[#00C8FF] p-7 text-white shadow-2xl transition-transform duration-300 hover:-translate-y-1.5"
              >
                <div>
                  <div className="flex items-baseline justify-between border-b border-white/25 pb-4">
                    <span className="font-heading text-6xl md:text-7xl font-black leading-none tracking-tight text-white">
                      {flow.number}
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-white/85">
                      BƯỚC {flow.number}
                    </span>
                  </div>

                  <p className="mt-5 text-[11px] font-bold uppercase tracking-wider text-white/85">
                    {flow.subtitle}
                  </p>
                  <h3 className="mt-1.5 text-xl font-extrabold tracking-normal text-white leading-snug">
                    {flow.title}
                  </h3>
                  <p className="mt-3 text-xs sm:text-sm leading-relaxed text-white/90">
                    {flow.description}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-1.5">
                    {flow.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md border border-white/30 bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-7 pt-4 border-t border-white/25">
                  <Link
                    to={flow.ctaPath}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-white px-4 py-3 text-xs font-extrabold uppercase tracking-wider text-[#0011FF] transition hover:bg-blue-50"
                  >
                    {flow.ctaLabel}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 6 — SHOWCASE & CTA
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0017FF] via-[#008DFF] to-[#00CBFF] px-6 pt-24 pb-8 text-white md:px-12 md:pt-32">
        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/90">
            MAKE IT · WEAR IT · MONETIZE IT
          </p>
          <h2 className="font-heading mt-4 text-4xl font-black uppercase tracking-normal text-white sm:text-6xl md:text-7xl leading-[0.98]">
            Bắt Đầu Chiếc Áo Thun Độc Bản Của Riêng Bạn Ngay Hôm Nay
          </h2>
          <p className="font-rader mx-auto mt-5 max-w-2xl text-sm text-white/95 sm:text-lg leading-relaxed">
            Phôi áo thun Cotton 280gsm chỉ từ 159.000 ₫ · Áo thiết kế in DTF/DTG hoàn chỉnh chỉ từ 219.000 ₫.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <Button
              asChild
              className="rounded-xl bg-white px-8 py-4 text-xs font-extrabold uppercase tracking-widest text-[#0011FF] hover:bg-blue-50 border-none"
            >
              <Link to="/design">Vào Xưởng Thiết Kế 3D</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-xl border-2 border-white bg-transparent px-8 py-4 text-xs font-extrabold uppercase tracking-widest text-white hover:bg-white hover:text-[#0011FF]"
            >
              <Link to="/products">Xem Kho Phôi Áo Thun</Link>
            </Button>
          </div>
        </div>

        <div className="max-w-7xl w-full mx-auto flex justify-end items-end relative z-0 select-none pointer-events-none mt-12">
          <span className="font-heading font-black uppercase tracking-tighter leading-none text-white/25 text-[clamp(4.5rem,12vw,11rem)] text-right translate-y-[4%]">
            ALTERA
          </span>
        </div>
      </section>
    </div>
  )
}
