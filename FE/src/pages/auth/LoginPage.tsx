import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { AxiosError } from 'axios'
import { Eye, EyeOff } from 'lucide-react'
import { useGoogleLogin } from '@react-oauth/google'

import { AuthService } from '@/services/auth.api'
import { useAuthStore } from '@/store/authStore'
import type { ApiError } from '@/types/api.types'

import logoSvg from '@/assets/logo1.png'
import AuthLayout from '@/components/layout/AuthLayout'

const REMEMBER_EMAIL_KEY = 'altera-remembered-email'

// ── Schema ─────────────────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().trim().min(1, 'Vui lòng nhập email').email('Email không đúng định dạng'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
})

type LoginFormValues = z.infer<typeof loginSchema>

// ── Component ──────────────────────────────────────────────────────────────
export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const storeLogin = useAuthStore((state) => state.login)

  const savedEmail = typeof window !== 'undefined' ? localStorage.getItem(REMEMBER_EMAIL_KEY) || '' : ''
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState<boolean>(Boolean(savedEmail))

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: savedEmail,
      password: '',
    },
  })

  // Redirect path after successful login
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/'

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true)
    try {
      const normalizedEmail = data.email.trim().toLowerCase()
      const response = await AuthService.login({
        email: normalizedEmail,
        password: data.password,
      })
      const { user, token } = response.data.data

      if (rememberMe) {
        localStorage.setItem(REMEMBER_EMAIL_KEY, normalizedEmail)
      } else {
        localStorage.removeItem(REMEMBER_EMAIL_KEY)
      }

      storeLogin(user, token)
      toast.success(response.data.message || 'Đăng nhập thành công.')
      navigate(user.role === 'ADMIN' ? '/admin/dashboard' : from, { replace: true })
    } catch (error) {
      const axiosError = error as AxiosError<ApiError & { errors?: Array<{ field: string; message: string }> }>
      const fieldError = axiosError.response?.data?.errors?.[0]?.message
      const errorMessage =
        fieldError ||
        axiosError.response?.data?.message ||
        'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true)
      try {
        const response = await AuthService.loginWithGoogle(tokenResponse.access_token)
        const { user, token } = response.data.data

        storeLogin(user, token)
        toast.success(response.data.message || 'Đăng nhập bằng Google thành công.')
        navigate(user.role === 'ADMIN' ? '/admin/dashboard' : from, { replace: true })
      } catch (error) {
        const axiosError = error as AxiosError<ApiError>
        toast.error(axiosError.response?.data?.message || 'Xác thực Google thất bại. Vui lòng thử lại.')
      } finally {
        setIsLoading(false)
      }
    },
    onError: () => {
      toast.error('Đăng nhập Google đã bị hủy hoặc thất bại.')
    },
  })

  return (
    <AuthLayout>
      {/* Left Column: Branding (Logo & Welcome Text) */}
      <div className="flex-1 flex flex-col p-8 md:p-12 lg:p-16 z-10 relative">
        <Link to="/" className="mb-auto">
          {/* We remove invert since the background is now white/cyan */}
          <img src={logoSvg} alt="ALTERA" className="h-7 w-auto" />
        </Link>
        <div className="my-auto mt-20 md:mt-auto hidden md:block">
          <h1 className="text-[3rem] md:text-6xl lg:text-[72px] font-black uppercase tracking-normal leading-[1]">
            <div className="text-transparent" style={{ WebkitTextStroke: '2px #0011FF' }}>WELCOME</div>
            <div className="text-transparent" style={{ WebkitTextStroke: '2px #0011FF' }}>TO</div>
            <div className="text-[#0011FF]">ALTERA</div>
          </h1>
        </div>
      </div>

      {/* Right Column: Form Card */}
      <div className="flex-1 flex items-center justify-center p-4 md:p-8 z-10">
        <div className="bg-[#F4F6F9] w-full max-w-[420px] rounded-[8px] shadow-lg flex flex-col p-8 lg:p-12 relative border-[1.5px] border-[#0011FF]/50">
          <h2 className="text-[2.25rem] font-bold text-[#0011FF] mb-2 font-heading tracking-normal uppercase">Đăng nhập</h2>
          <p className="text-[11px] text-[#0011FF] mb-8 leading-relaxed font-medium">
            Chào mừng bạn! Đăng nhập để tiếp tục sáng tạo phong cách thời trang độc bản.
          </p>

          {/* Tabs (Visual only) */}
          <div className="flex justify-center text-[10px] font-bold text-[#0011FF] border-b border-[#0011FF]/20 mb-8 uppercase tracking-widest">
            <div className="pb-2 border-b-[3px] border-[#0011FF] text-center px-10">Tài khoản</div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 flex flex-col" noValidate>
            <div>
              <label className="text-[10px] text-[#0011FF] font-bold block mb-1.5 uppercase">Email</label>
              <input
                type="email"
                autoComplete="email"
                placeholder="nhapemail@gmail.com"
                {...register('email')}
                className="w-full border-[1.5px] border-[#0011FF]/50 rounded-[4px] px-4 py-3.5 text-sm text-black outline-none focus:border-[#0011FF] transition-colors bg-white font-medium placeholder:text-black/35"
              />
              {errors.email && <span className="text-red-500 text-[10px] mt-1 block font-bold">{errors.email.message}</span>}
            </div>

            <div>
              <label className="text-[10px] text-[#0011FF] font-bold block mb-1.5 uppercase">Mật khẩu</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Nhập mật khẩu của bạn"
                  {...register('password')}
                  className="w-full border-[1.5px] border-[#0011FF]/50 rounded-[4px] pl-4 pr-11 py-3.5 text-sm text-black outline-none focus:border-[#0011FF] transition-colors bg-white font-medium placeholder:text-black/35"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0011FF]/60 hover:text-[#0011FF] p-1 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <span className="text-red-500 text-[10px] mt-1 block font-bold">{errors.password.message}</span>}
            </div>

            <div className="flex items-center gap-2 mt-1">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded-[2px] border-[#0011FF]/50 accent-[#0011FF] cursor-pointer"
              />
              <label htmlFor="remember" className="text-[10px] text-[#0011FF] font-bold cursor-pointer">
                Ghi nhớ đăng nhập
              </label>
            </div>

            <div className="mt-4 space-y-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#0011FF] text-white text-[13px] font-bold tracking-widest py-4 rounded-[4px] hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isLoading ? 'ĐANG ĐĂNG NHẬP...' : 'ĐĂNG NHẬP'}
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleGoogleLogin()}
                className="w-full border-[1.5px] border-[#0011FF]/35 bg-white text-[#0011FF] text-xs font-bold py-3.5 rounded-[4px] hover:bg-[#0011FF]/5 transition-colors flex items-center justify-center gap-2 tracking-normal disabled:opacity-50"
              >
                Đăng nhập nhanh bằng Google
              </button>
            </div>
          </form>

          {/* Footer links */}
          <div className="mt-8 flex items-center justify-between text-[11px] text-[#0011FF] font-bold tracking-normal">
            <div className="flex items-center gap-1">
              <span className="opacity-60 font-medium">Chưa có tài khoản?</span>
              <Link to="/auth/register" className="underline hover:opacity-80 transition-opacity">Đăng ký ngay</Link>
            </div>
            <Link to="/auth/forgot-password" className="opacity-60 hover:opacity-100 transition-opacity font-medium">Quên mật khẩu?</Link>
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}
