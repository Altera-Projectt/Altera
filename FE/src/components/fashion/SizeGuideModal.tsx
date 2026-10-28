import { useMemo, useState } from 'react'
import { Check, Ruler, Sparkles, X } from 'lucide-react'

export type SizeMeasurementRow = {
  label: string
  recommendedHeight: string
  recommendedWeight: string
  chest: number
  length: number
  shoulder: number
  sleeve: number
}

const FIT_CHARTS: Record<
  'BOXY' | 'OVERSIZE' | 'REGULAR' | 'BABYTEE',
  {
    title: string
    subtitle: string
    rows: SizeMeasurementRow[]
  }
> = {
  BOXY: {
    title: 'Form Boxy Heavyweight (260gsm – 280gsm)',
    subtitle: 'Vai trễ hiện đại, thân áo rộng vuông vức, chiều dài vừa ngang hông tôn dáng.',
    rows: [
      {
        label: 'S',
        recommendedHeight: '152 – 164 cm',
        recommendedWeight: '45 – 56 kg',
        chest: 108,
        length: 66,
        shoulder: 51,
        sleeve: 21,
      },
      {
        label: 'M',
        recommendedHeight: '163 – 172 cm',
        recommendedWeight: '55 – 66 kg',
        chest: 112,
        length: 69,
        shoulder: 53,
        sleeve: 22,
      },
      {
        label: 'L',
        recommendedHeight: '170 – 178 cm',
        recommendedWeight: '65 – 76 kg',
        chest: 116,
        length: 72,
        shoulder: 55,
        sleeve: 23,
      },
      {
        label: 'XL',
        recommendedHeight: '176 – 186 cm',
        recommendedWeight: '75 – 90 kg',
        chest: 120,
        length: 75,
        shoulder: 57,
        sleeve: 24,
      },
    ],
  },
  OVERSIZE: {
    title: 'Form Oversize Streetwear (240gsm)',
    subtitle: 'Form rộng thùng thình chuẩn Hàn Quốc, tay lỡ che khuỷu tay, thoải mái vận động.',
    rows: [
      {
        label: 'S',
        recommendedHeight: '150 – 163 cm',
        recommendedWeight: '44 – 55 kg',
        chest: 110,
        length: 69,
        shoulder: 52,
        sleeve: 22,
      },
      {
        label: 'M',
        recommendedHeight: '162 – 172 cm',
        recommendedWeight: '55 – 66 kg',
        chest: 114,
        length: 72,
        shoulder: 54,
        sleeve: 23,
      },
      {
        label: 'L',
        recommendedHeight: '170 – 180 cm',
        recommendedWeight: '66 – 78 kg',
        chest: 118,
        length: 75,
        shoulder: 56,
        sleeve: 24,
      },
      {
        label: 'XL',
        recommendedHeight: '176 – 188 cm',
        recommendedWeight: '78 – 92 kg',
        chest: 122,
        length: 77,
        shoulder: 58,
        sleeve: 25,
      },
    ],
  },
  REGULAR: {
    title: 'Form Regular Fit (220gsm – 250gsm)',
    subtitle: 'Form suông vừa vặn truyền thống, lịch sự, dễ sơ vin hoặc mặc hàng ngày.',
    rows: [
      {
        label: 'S',
        recommendedHeight: '153 – 164 cm',
        recommendedWeight: '46 – 55 kg',
        chest: 98,
        length: 66,
        shoulder: 44,
        sleeve: 20,
      },
      {
        label: 'M',
        recommendedHeight: '163 – 171 cm',
        recommendedWeight: '55 – 64 kg',
        chest: 102,
        length: 69,
        shoulder: 46,
        sleeve: 21,
      },
      {
        label: 'L',
        recommendedHeight: '170 – 178 cm',
        recommendedWeight: '64 – 74 kg',
        chest: 106,
        length: 72,
        shoulder: 48,
        sleeve: 22,
      },
      {
        label: 'XL',
        recommendedHeight: '175 – 185 cm',
        recommendedWeight: '74 – 86 kg',
        chest: 110,
        length: 74,
        shoulder: 50,
        sleeve: 23,
      },
    ],
  },
  BABYTEE: {
    title: 'Form Baby Tee Croptop (200gsm)',
    subtitle: 'Form ôm nhẹ nhàng tôn dáng vòng eo, chất thun 4 chiều co giãn êm ái.',
    rows: [
      {
        label: 'S',
        recommendedHeight: '148 – 160 cm',
        recommendedWeight: '40 – 48 kg',
        chest: 82,
        length: 49,
        shoulder: 36,
        sleeve: 15,
      },
      {
        label: 'M',
        recommendedHeight: '155 – 165 cm',
        recommendedWeight: '48 – 55 kg',
        chest: 86,
        length: 51,
        shoulder: 38,
        sleeve: 16,
      },
      {
        label: 'L',
        recommendedHeight: '160 – 170 cm',
        recommendedWeight: '55 – 62 kg',
        chest: 90,
        length: 53,
        shoulder: 40,
        sleeve: 17,
      },
    ],
  },
}

type SizeGuideModalProps = {
  open: boolean
  onClose: () => void
  productName?: string
  availableSizes?: string[]
  onSelectSize?: (sizeLabel: string) => void
}

export function SizeGuideModal({
  open,
  onClose,
  productName = '',
  availableSizes,
  onSelectSize,
}: SizeGuideModalProps) {
  const initialFit = useMemo<'BOXY' | 'OVERSIZE' | 'REGULAR' | 'BABYTEE'>(() => {
    const lower = productName.toLowerCase()
    if (lower.includes('baby')) return 'BABYTEE'
    if (lower.includes('oversize')) return 'OVERSIZE'
    if (lower.includes('regular') || lower.includes('sport') || lower.includes('dry'))
      return 'REGULAR'
    return 'BOXY'
  }, [productName])

  const [fitType, setFitType] = useState<'BOXY' | 'OVERSIZE' | 'REGULAR' | 'BABYTEE'>(initialFit)
  const [heightCm, setHeightCm] = useState<number>(168)
  const [weightKg, setWeightKg] = useState<number>(60)
  const [fitPref, setFitPref] = useState<'STANDARD' | 'LOOSE'>('STANDARD')

  const recommendedSize = useMemo(() => {
    let base: 'S' | 'M' | 'L' | 'XL' = 'M'
    if (fitType === 'BABYTEE') {
      if (weightKg <= 48 && heightCm <= 160) base = 'S'
      else if (weightKg <= 55 && heightCm <= 166) base = 'M'
      else base = 'L'
    } else {
      if (weightKg <= 55 && heightCm <= 164) base = 'S'
      else if (weightKg <= 66 && heightCm <= 172) base = 'M'
      else if (weightKg <= 76 && heightCm <= 179) base = 'L'
      else base = 'XL'
    }

    if (fitPref === 'LOOSE') {
      if (base === 'S') base = 'M'
      else if (base === 'M') base = 'L'
      else if (base === 'L' && fitType !== 'BABYTEE') base = 'XL'
    }

    if (availableSizes && availableSizes.length > 0 && !availableSizes.includes(base)) {
      return availableSizes[0]
    }
    return base
  }, [fitType, heightCm, weightKg, fitPref, availableSizes])

  if (!open) return null

  const activeChart = FIT_CHARTS[fitType]
  const matchedRow =
    activeChart.rows.find((r) => r.label === recommendedSize) || activeChart.rows[0]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="size-guide-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-blue-400/25 bg-[#0F172A] p-5 text-slate-100 shadow-2xl sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-blue-400/15 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-cyan-400">
              <Ruler className="h-3.5 w-3.5" />
              Bảng số đo &amp; Tư vấn chọn Size Áo Thun
            </div>
            <h2
              id="size-guide-modal-title"
              className="mt-2 text-xl font-bold tracking-normal text-slate-100 sm:text-2xl"
            >
              Hướng dẫn chọn Size Áo Thun Chuẩn Form ALTERA
            </h2>
            {productName && (
              <p className="mt-1 text-xs text-slate-400">
                Đang xem cho sản phẩm: <strong className="text-cyan-400">{productName}</strong>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng bảng hướng dẫn chọn size"
            className="rounded-lg border border-blue-400/20 bg-[#0A1122] p-2 text-slate-400 transition hover:border-cyan-400/50 hover:text-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 1. Interactive Size Calculator */}
        <div className="mt-5 rounded-xl border border-cyan-400/25 bg-gradient-to-br from-[#162038] to-[#0A1122] p-4 sm:p-5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
            <Sparkles className="h-4 w-4" />
            Công cụ gợi ý Size nhanh theo Chiều cao &amp; Cân nặng
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-300">
                <span>Chiều cao</span>
                <span className="font-bold text-cyan-400">{heightCm} cm</span>
              </div>
              <input
                type="range"
                min={145}
                max={190}
                value={heightCm}
                onChange={(e) => setHeightCm(Number(e.target.value))}
                className="mt-2 w-full accent-cyan-400"
              />
              <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                <span>145 cm</span>
                <span>190 cm</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-300">
                <span>Cân nặng</span>
                <span className="font-bold text-cyan-400">{weightKg} kg</span>
              </div>
              <input
                type="range"
                min={40}
                max={95}
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value))}
                className="mt-2 w-full accent-cyan-400"
              />
              <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                <span>40 kg</span>
                <span>95 kg</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-300">Độ rộng mong muốn</p>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setFitPref('STANDARD')}
                  className={`rounded-lg border px-2.5 py-2 text-xs font-semibold transition ${
                    fitPref === 'STANDARD'
                      ? 'border-cyan-400 bg-blue-600 text-slate-100'
                      : 'border-blue-400/20 bg-[#060B16] text-slate-400 hover:text-slate-100'
                  }`}
                >
                  Chuẩn form
                </button>
                <button
                  type="button"
                  onClick={() => setFitPref('LOOSE')}
                  className={`rounded-lg border px-2.5 py-2 text-xs font-semibold transition ${
                    fitPref === 'LOOSE'
                      ? 'border-cyan-400 bg-blue-600 text-slate-100'
                      : 'border-blue-400/20 bg-[#060B16] text-slate-400 hover:text-slate-100'
                  }`}
                >
                  Rộng thoải mái
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cyan-400/30 bg-[#060B16]/90 p-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-400 text-lg font-extrabold text-slate-950">
                {recommendedSize}
              </div>
              <div>
                <p className="text-xs text-slate-400">Size đề xuất phù hợp nhất với bạn:</p>
                <p className="text-sm font-bold tracking-normal text-slate-100">
                  Size {recommendedSize} · Ngực {matchedRow.chest}cm · Dài áo {matchedRow.length}cm · Vai {matchedRow.shoulder}cm
                </p>
              </div>
            </div>
            {onSelectSize && (
              <button
                type="button"
                onClick={() => {
                  onSelectSize(recommendedSize)
                  onClose()
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-slate-100 transition hover:bg-blue-500"
              >
                <Check className="h-4 w-4" />
                Chọn Size {recommendedSize} ngay
              </button>
            )}
          </div>
        </div>

        {/* 2. Fit Type Selector Tabs */}
        <div className="mt-5">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['BOXY', 'Form Boxy 280gsm'],
                ['OVERSIZE', 'Form Oversize 240gsm'],
                ['REGULAR', 'Form Regular 220gsm'],
                ['BABYTEE', 'Form Baby Tee'],
              ] as const
            ).map(([key, label]) => {
              const active = fitType === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFitType(key)}
                  className={`rounded-lg border px-3.5 py-2 text-xs font-semibold transition ${
                    active
                      ? 'border-cyan-400 bg-[#162038] text-cyan-400'
                      : 'border-blue-400/15 bg-[#0A1122] text-slate-400 hover:text-slate-100'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>

          <div className="mt-3">
            <h3 className="text-sm font-bold tracking-normal text-slate-100">
              {activeChart.title}
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">{activeChart.subtitle}</p>
          </div>

          {/* Measurement Table */}
          <div className="mt-3 overflow-x-auto rounded-xl border border-blue-400/20 bg-[#0A1122]">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-blue-400/15 bg-[#162038] text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  <th className="px-3.5 py-3">Size</th>
                  <th className="px-3.5 py-3">Chiều cao gợi ý</th>
                  <th className="px-3.5 py-3">Cân nặng gợi ý</th>
                  <th className="px-3.5 py-3 text-center">Vòng ngực (cm)</th>
                  <th className="px-3.5 py-3 text-center">Dài áo (cm)</th>
                  <th className="px-3.5 py-3 text-center">Rộng vai (cm)</th>
                  <th className="px-3.5 py-3 text-center">Dài tay (cm)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-400/10">
                {activeChart.rows.map((row) => {
                  const isRec = row.label === recommendedSize
                  return (
                    <tr
                      key={row.label}
                      className={
                        isRec
                          ? 'bg-cyan-400/10 font-semibold text-cyan-300'
                          : 'text-slate-200 hover:bg-[#162038]/50'
                      }
                    >
                      <td className="px-3.5 py-3 font-bold">
                        <span className="inline-flex items-center gap-1.5">
                          <span>{row.label}</span>
                          {isRec && (
                            <span className="rounded bg-cyan-400 px-1.5 py-0.5 text-[10px] font-extrabold text-slate-950">
                              Đề xuất
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-3.5 py-3">{row.recommendedHeight}</td>
                      <td className="px-3.5 py-3">{row.recommendedWeight}</td>
                      <td className="px-3.5 py-3 text-center font-mono">{row.chest}</td>
                      <td className="px-3.5 py-3 text-center font-mono">{row.length}</td>
                      <td className="px-3.5 py-3 text-center font-mono">{row.shoulder}</td>
                      <td className="px-3.5 py-3 text-center font-mono">{row.sleeve}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 text-xs text-slate-400">
            <div className="rounded-xl border border-blue-400/15 bg-[#0A1122] p-3.5">
              <p className="font-bold text-slate-200">Lưu ý về độ co rút &amp; sai số:</p>
              <p className="mt-1 leading-relaxed">
                Áo thun Cotton 2 chiều / 4 chiều của ALTERA đã qua xử lý wash chống co rút. Thông số thực tế có thể chênh lệch ±1.5 cm tùy lô may.
              </p>
            </div>
            <div className="rounded-xl border border-blue-400/15 bg-[#0A1122] p-3.5">
              <p className="font-bold text-slate-200">Mẹo chọn Size khi phân vân:</p>
              <p className="mt-1 leading-relaxed">
                Nếu chiều cao và cân nặng nằm ở 2 size khác nhau, hãy ưu tiên chọn theo <strong className="text-cyan-400">Cân nặng</strong> để phần vai và ngực luôn thoải mái.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
