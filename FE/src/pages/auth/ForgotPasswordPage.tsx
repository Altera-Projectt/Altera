import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { AxiosError } from 'axios'
import logoSvg from '@/assets/logo2.png'
import { toast } from 'sonner'
import { AuthService } from '@/services/auth.api'
import type { ApiError } from '@/types/api.types'

const emailSchema = z.object({
  email: z.string().trim().min(1, 'Vui lòng nhập email').email('Email không đúng định dạng'),
})

const passwordSchema = z.object({
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự').regex(/\d/, 'Mật khẩu phải chứa ít nhất một chữ số'),
  confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu mới'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
})

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [devCodeHint, setDevCodeHint] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Step 1: Email Form
  const { register: registerEmail, handleSubmit: handleEmailSubmit, formState: { errors: emailErrors } } = useForm({
    resolver: zodResolver(emailSchema),
  })

  // Step 3: Password Form
  const { register: registerPassword, handleSubmit: handlePasswordSubmit, formState: { errors: passwordErrors } } = useForm({
    resolver: zodResolver(passwordSchema),
  })

  const onEmailSubmit = async (data: { email: string }) => {
    setIsLoading(true)
    const normalizedEmail = data.email.trim().toLowerCase()
    try {
      const res = await AuthService.forgotPassword(normalizedEmail)
      setEmail(normalizedEmail)
      const receivedCode = res.data?.data?.devCode
      if (receivedCode && receivedCode.length === 6) {
        setDevCodeHint(receivedCode)
        setCode(receivedCode.split(''))
      }
      setStep(2)
      toast.success(res.data?.message || 'Đã tạo mã xác thực khôi phục mật khẩu.')
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>
      toast.error(axiosError.response?.data?.message || 'Không tìm thấy tài khoản với email này.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCodeChange = (index: number, value: string) => {
    const cleanVal = value.replace(/\D/g, '').slice(-1)
    const newCode = [...code]
    newCode[index] = cleanVal
    setCode(newCode)
    
    // Auto-focus next input
    if (cleanVal && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`)
      nextInput?.focus()
    }
  }

  const onCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const fullCode = code.join('')
    if (fullCode.length < 6) {
      toast.error('Vui lòng nhập đầy đủ mã xác thực gồm 6 chữ số.')
      return
    }
    setIsLoading(true)
    try {
      await AuthService.verifyResetCode({ email, code: fullCode })
      toast.success('Xác thực mã thành công. Vui lòng đặt mật khẩu mới.')
      setStep(3)
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>
      toast.error(axiosError.response?.data?.message || 'Mã xác thực không chính xác hoặc đã hết hạn.')
    } finally {
      setIsLoading(false)
    }
  }

  const onPasswordSubmit = async (data: { password: string; confirmPassword: string }) => {
    setIsLoading(true)
    try {
      await AuthService.resetPassword({
        email,
        code: code.join(''),
        password: data.password,
      })
      toast.success('Đặt lại mật khẩu mới thành công!')
      setStep(4)
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>
      toast.error(axiosError.response?.data?.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E0E0E0] p-4 md:p-8 font-body">
      {/* Layer 1: Màu chủ đề (Solid Blue Gradient) */}
      <div className="w-full max-w-[1100px] min-h-[640px] bg-gradient-to-br from-[#0011FF] to-[#00C8FF] p-4 md:p-6 shadow-2xl flex">
        
        {/* Layer 2: Lớp Kính (Glass Layer) */}
        <div className="w-full h-full border-[2px] border-gray-400/80 bg-white/10 backdrop-blur-md rounded-[8px] flex flex-col md:flex-row p-6 md:p-10 relative overflow-hidden">
          
          {/* Decorative inner glass highlights */}
          <div className="absolute top-0 left-0 w-[200px] h-[200px] bg-white/10 blur-2xl rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0"></div>
          
          {/* Left Side (Branding) */}
          <div className="flex-1 flex flex-col z-10 relative pr-4">
            <Link to="/" className="mb-auto">
              <img src={logoSvg} alt="ALTERA" className="h-7 w-auto" />
            </Link>
            <div className="my-auto mt-20 md:mt-auto">
              <h1 className="text-[3rem] md:text-6xl lg:text-[72px] font-black uppercase tracking-normal leading-[1]">
                <div className="text-transparent" style={{ WebkitTextStroke: '1.5px white' }}>WELCOME</div>
                <div className="text-transparent" style={{ WebkitTextStroke: '1.5px white' }}>TO</div>
                <div className="text-white">ALTERA</div>
              </h1>
            </div>
          </div>
          
          {/* Layer 3: Lớp Màu Trắng (White Card) */}
          <div className="flex-1 w-full md:w-auto mt-8 md:mt-0 flex items-center justify-center z-10 relative">
            <div className="bg-[#F4F6F9] w-full h-full max-h-[540px] rounded-[8px] shadow-lg flex flex-col p-8 lg:p-12 relative overflow-hidden border-[1.5px] border-[#0011FF]/50">
              
              {step === 1 && (
                <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-500">
                  <h2 className="text-[2rem] font-bold text-[#0011FF] mb-3 font-heading tracking-normal uppercase">Quên mật khẩu</h2>
                  <p className="text-xs text-[#0011FF]/80 mb-8 leading-relaxed max-w-[320px] font-medium">
                    Nhập địa chỉ Email bạn đã dùng để đăng ký tài khoản ALTERA. Hệ thống sẽ cấp mã xác thực 6 chữ số để đặt lại mật khẩu.
                  </p>

                  <form onSubmit={handleEmailSubmit(onEmailSubmit)} className="space-y-6 flex-1 flex flex-col" noValidate>
                    <div>
                      <label className="text-[10px] text-[#0011FF] font-bold block mb-1.5 uppercase">Email đã đăng ký</label>
                      <input 
                        type="email"
                        placeholder="nhapemail@gmail.com"
                        {...registerEmail('email')}
                        className="w-full border border-[#0011FF]/30 rounded-[4px] px-4 py-3 text-sm text-black outline-none focus:border-[#0011FF] transition-colors bg-white font-medium"
                      />
                      {emailErrors.email && <span className="text-red-500 text-[10px] mt-1 block font-bold">{emailErrors.email.message as string}</span>}
                    </div>
                    
                    <div className="mt-auto pt-8">
                      <button type="submit" disabled={isLoading} className="w-full bg-[#0011FF] text-white text-[13px] font-bold tracking-widest py-4 rounded-[4px] hover:opacity-90 transition-opacity disabled:opacity-50">
                        {isLoading ? 'ĐANG XỬ LÝ...' : 'TIẾP TỤC'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {step === 2 && (
                <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-500">
                  <h2 className="text-[2rem] font-bold text-[#0011FF] mb-3 font-heading tracking-normal uppercase">Nhập mã xác thực</h2>
                  <p className="text-xs text-[#0011FF]/80 mb-4 leading-relaxed font-medium">
                    Vui lòng nhập mã xác thực 6 chữ số cho tài khoản <strong>{email}</strong>.
                  </p>
                  {devCodeHint && (
                    <div className="mb-4 rounded border border-[#0011FF]/30 bg-blue-50 px-3 py-2 text-xs text-[#0011FF]">
                      Mã xác thực khôi phục của bạn: <strong className="font-mono text-sm">{devCodeHint}</strong>
                    </div>
                  )}

                  <form onSubmit={onCodeSubmit} className="space-y-6 flex-1 flex flex-col">
                    <div className="flex items-center justify-between gap-2">
                      {code.map((digit, idx) => (
                        <input 
                          key={idx}
                          id={`code-${idx}`}
                          type="text"
                          inputMode="numeric"
                          value={digit}
                          onChange={(e) => handleCodeChange(idx, e.target.value)}
                          className="w-11 h-12 border border-[#0011FF]/40 rounded-[4px] text-center text-lg font-bold text-black outline-none focus:border-[#0011FF] transition-colors bg-white"
                        />
                      ))}
                    </div>
                    
                    <div className="mt-auto pt-8">
                      <button type="submit" disabled={isLoading} className="w-full bg-[#0011FF] text-white text-[13px] font-bold tracking-widest py-4 rounded-[4px] hover:opacity-90 transition-opacity disabled:opacity-50">
                        {isLoading ? 'ĐANG XÁC THỰC...' : 'XÁC NHẬN MÃ'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {step === 3 && (
                <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-500">
                  <h2 className="text-[2rem] font-bold text-[#0011FF] mb-3 font-heading tracking-normal uppercase">Mật khẩu mới</h2>
                  <p className="text-xs text-[#0011FF]/80 mb-6 leading-relaxed font-medium">
                    Thiết lập mật khẩu mới (tối thiểu 6 ký tự và có ít nhất 1 chữ số).
                  </p>

                  <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-5 flex-1 flex flex-col" noValidate>
                    <div>
                      <label className="text-[10px] text-[#0011FF] font-bold block mb-1.5 uppercase">Mật khẩu mới</label>
                      <div className="relative">
                        <input 
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Nhập mật khẩu mới"
                          {...registerPassword('password')}
                          className="w-full border border-[#0011FF]/30 rounded-[4px] pl-4 pr-11 py-3 text-sm text-black outline-none focus:border-[#0011FF] transition-colors bg-white font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0011FF]/60 hover:text-[#0011FF] p-1"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {passwordErrors.password && <span className="text-red-500 text-[10px] mt-1 block font-bold">{passwordErrors.password.message as string}</span>}
                    </div>
                    <div>
                      <label className="text-[10px] text-[#0011FF] font-bold block mb-1.5 uppercase">Nhập lại mật khẩu mới</label>
                      <div className="relative">
                        <input 
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Xác nhận mật khẩu mới"
                          {...registerPassword('confirmPassword')}
                          className="w-full border border-[#0011FF]/30 rounded-[4px] pl-4 pr-11 py-3 text-sm text-black outline-none focus:border-[#0011FF] transition-colors bg-white font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                          aria-label={showConfirmPassword ? 'Ẩn mật khẩu xác nhận' : 'Hiện mật khẩu xác nhận'}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0011FF]/60 hover:text-[#0011FF] p-1"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {passwordErrors.confirmPassword && <span className="text-red-500 text-[10px] mt-1 block font-bold">{passwordErrors.confirmPassword.message as string}</span>}
                    </div>
                    
                    <div className="mt-auto pt-6">
                      <button type="submit" disabled={isLoading} className="w-full bg-[#0011FF] text-white text-[13px] font-bold tracking-widest py-4 rounded-[4px] hover:opacity-90 transition-opacity disabled:opacity-50">
                        {isLoading ? 'ĐANG LƯU...' : 'LƯU MẬT KHẨU MỚI'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {step === 4 && (
                <div className="flex flex-col items-center justify-center h-full text-center animate-in fade-in zoom-in-95 duration-500">
                  <CheckCircle2 className="w-16 h-16 text-[#0011FF] mb-6" />
                  <h2 className="text-[2rem] font-bold text-[#0011FF] mb-4 font-heading tracking-normal uppercase">Hoàn tất khôi phục</h2>
                  <p className="text-xs text-[#0011FF]/80 mb-8 leading-relaxed max-w-[280px] font-medium">
                    Mật khẩu của bạn đã được cập nhật thành công. Vui lòng sử dụng mật khẩu mới để đăng nhập.
                  </p>
                  <div className="w-full mt-auto pt-8">
                    <button 
                      onClick={() => navigate('/auth/login')}
                      className="w-full bg-[#0011FF] text-white text-[13px] font-bold tracking-widest py-4 rounded-[4px] hover:opacity-90 transition-opacity"
                    >
                      ĐĂNG NHẬP NGAY
                    </button>
                  </div>
                </div>
              )}

              {/* Footer link (only show on step 1) */}
              {step === 1 && (
                <div className="mt-6 flex justify-center text-[11px] text-[#0011FF] font-bold tracking-normal">
                  <Link to="/auth/login" className="opacity-70 hover:opacity-100 transition-opacity flex items-center gap-1 font-semibold">
                    &larr; Quay lại trang Đăng nhập
                  </Link>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
