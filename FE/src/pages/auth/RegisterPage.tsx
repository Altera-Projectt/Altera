import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { AxiosError } from 'axios'

import { AuthService } from '@/services/auth.api'
import { useAuthStore } from '@/store/authStore'
import type { ApiError } from '@/types/api.types'
import { useGoogleLogin } from '@react-oauth/google'
import logoSvg from '@/assets/logo1.png'
import AuthLayout from '@/components/layout/AuthLayout'

// ── Schema ─────────────────────────────────────────────────────────────────
const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Họ và tên phải có ít nhất 2 ký tự'),
    email: z.string().min(1, 'Vui lòng nhập email').email('Email không đúng định dạng'),
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự').regex(/\d/, 'Mật khẩu phải chứa ít nhất một chữ số'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  })

type RegisterFormValues = z.infer<typeof registerSchema>

// ── Component ──────────────────────────────────────────────────────────────
export function RegisterPage() {
  const navigate = useNavigate()
  const storeLogin = useAuthStore((state) => state.login)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true)
    try {
      const response = await AuthService.register(data)
      toast.success(response.data.message || 'Đăng ký thành công! Vui lòng đăng nhập.')
      navigate('/auth/login')
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>
      const errorMessage = axiosError.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.'
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
        navigate('/')
      } catch (error) {
        toast.error('Xác thực Google thất bại. Vui lòng thử lại.')
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
      <div className="flex-1 flex flex-col p-8 md:p-12 lg:p-16 h-full w-full justify-center relative">
        {/* Logo at Top Left */}
        <div className="absolute top-8 left-8 md:top-12 md:left-12 z-20">
          <Link to="/">
            <img src={logoSvg} alt="ALTERA" className="h-7 w-auto" />
          </Link>
        </div>

        <h2 className="text-[2.75rem] font-bold text-[#0011FF] mb-12 mt-12 md:mt-8 font-heading tracking-tight leading-none uppercase">Đăng ký</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col lg:flex-row gap-10 lg:gap-16 w-full" noValidate>

          {/* Left Column: Form Fields */}
          <div className="flex-1 flex flex-col justify-center space-y-6">
            <div>
              <input
                type="text"
                placeholder="Họ và tên"
                {...register('fullName')}
                className="w-full border-[1.5px] border-[#0011FF]/50 rounded-[4px] px-4 py-3.5 text-sm text-black outline-none focus:border-[#0011FF] transition-colors bg-white placeholder:text-black/40 font-medium"
              />
              {errors.fullName && <span className="text-red-500 text-[10px] mt-1 block font-bold">{errors.fullName.message}</span>}
            </div>

            <div>
              <input
                type="email"
                placeholder="Địa chỉ Email"
                {...register('email')}
                className="w-full border-[1.5px] border-[#0011FF]/50 rounded-[4px] px-4 py-3.5 text-sm text-black outline-none focus:border-[#0011FF] transition-colors bg-white placeholder:text-black/40 font-medium"
              />
              {errors.email && <span className="text-red-500 text-[10px] mt-1 block font-bold">{errors.email.message}</span>}
            </div>

            <div>
              <input
                type="password"
                placeholder="Mật khẩu"
                {...register('password')}
                className="w-full border-[1.5px] border-[#0011FF]/50 rounded-[4px] px-4 py-3.5 text-sm text-black outline-none focus:border-[#0011FF] transition-colors bg-white placeholder:text-black/40 font-medium"
              />
              {errors.password && <span className="text-red-500 text-[10px] mt-1 block font-bold">{errors.password.message}</span>}
            </div>

            <div>
              <input
                type="password"
                placeholder="Xác nhận mật khẩu"
                {...register('confirmPassword')}
                className="w-full border-[1.5px] border-[#0011FF]/50 rounded-[4px] px-4 py-3.5 text-sm text-black outline-none focus:border-[#0011FF] transition-colors bg-white placeholder:text-black/40 font-medium"
              />
              {errors.confirmPassword && <span className="text-red-500 text-[10px] mt-1 block font-bold">{errors.confirmPassword.message}</span>}
            </div>
          </div>

          {/* Right Column: Actions */}
          <div className="flex-1 flex flex-col justify-center lg:pl-6 border-t lg:border-t-0 lg:border-l border-[#0011FF]/10 pt-8 lg:pt-0">

            <button type="submit" disabled={isLoading} className="w-full bg-[#0011FF] text-white text-[14px] font-bold tracking-widest py-4 rounded-[4px] hover:opacity-90 transition-opacity mb-4">
              {isLoading ? 'ĐANG ĐĂNG KÝ...' : 'ĐĂNG KÝ'}
            </button>

            <div className="flex justify-between items-center text-[12px] font-medium mb-12">
              <span className="text-[#0011FF]/60 font-bold">Đã có tài khoản?</span>
              <Link to="/auth/login" className="text-[#0011FF] font-black hover:underline tracking-wide">Đăng nhập ngay</Link>
            </div>

            <div className="relative flex justify-center mb-8">
              <span className="bg-[#F0F8FF] px-4 text-xs font-bold text-[#0011FF]/60 relative z-10">Hoặc</span>
              <div className="absolute inset-0 flex items-center z-0">
                <span className="w-full border-t border-[#0011FF]/20" />
              </div>
            </div>

            <div className="space-y-4">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleGoogleLogin()}
                className="w-full border-[1.5px] border-[#0011FF]/30 text-[#0011FF] text-xs font-bold py-3.5 rounded-[4px] hover:bg-[#0011FF]/5 transition-colors flex items-center justify-center gap-2 tracking-wide"
              >
                Đăng ký bằng Google
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => {}}
                className="w-full border-[1.5px] border-[#0011FF]/30 text-[#0011FF] text-xs font-bold py-3.5 rounded-[4px] hover:bg-[#0011FF]/5 transition-colors flex items-center justify-center gap-2 tracking-wide"
              >
                Đăng ký bằng Facebook
              </button>
            </div>

          </div>
        </form>
      </div>
    </AuthLayout>
  )
}
