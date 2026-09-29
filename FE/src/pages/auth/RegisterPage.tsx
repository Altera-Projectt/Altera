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
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().min(1, 'Email is required').email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters').regex(/\d/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
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
      toast.success(response.data.message || 'Registration successful! Please log in.')
      navigate('/auth/login')
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>
      const errorMessage = axiosError.response?.data?.message || 'Registration failed. Please try again.'
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
        toast.success(response.data.message || 'Successfully signed in with Google.')
        navigate('/')
      } catch (error) {
        toast.error('Google authentication failed. Please try again.')
      } finally {
        setIsLoading(false)
      }
    },
    onError: () => {
      toast.error('Google authentication was canceled or failed.')
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

        <h2 className="text-[2.75rem] font-bold text-[#0011FF] mb-12 mt-12 md:mt-8 font-heading tracking-tight leading-none uppercase">Sign up</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col lg:flex-row gap-10 lg:gap-16 w-full" noValidate>

          {/* Left Column: Form Fields */}
          <div className="flex-1 flex flex-col justify-center space-y-6">
            <div>
              <input
                type="text"
                placeholder="Full name"
                {...register('fullName')}
                className="w-full border-[1.5px] border-[#0011FF]/50 rounded-[4px] px-4 py-3.5 text-sm text-black outline-none focus:border-[#0011FF] transition-colors bg-white placeholder:text-black/40 font-medium"
              />
              {errors.fullName && <span className="text-red-500 text-[10px] mt-1 block font-bold">{errors.fullName.message}</span>}
            </div>

            <div>
              <input
                type="email"
                placeholder="Email address"
                {...register('email')}
                className="w-full border-[1.5px] border-[#0011FF]/50 rounded-[4px] px-4 py-3.5 text-sm text-black outline-none focus:border-[#0011FF] transition-colors bg-white placeholder:text-black/40 font-medium"
              />
              {errors.email && <span className="text-red-500 text-[10px] mt-1 block font-bold">{errors.email.message}</span>}
            </div>

            <div>
              <input
                type="password"
                placeholder="Password"
                {...register('password')}
                className="w-full border-[1.5px] border-[#0011FF]/50 rounded-[4px] px-4 py-3.5 text-sm text-black outline-none focus:border-[#0011FF] transition-colors bg-white placeholder:text-black/40 font-medium"
              />
              {errors.password && <span className="text-red-500 text-[10px] mt-1 block font-bold">{errors.password.message}</span>}
            </div>

            <div>
              <input
                type="password"
                placeholder="Confirm Password"
                {...register('confirmPassword')}
                className="w-full border-[1.5px] border-[#0011FF]/50 rounded-[4px] px-4 py-3.5 text-sm text-black outline-none focus:border-[#0011FF] transition-colors bg-white placeholder:text-black/40 font-medium"
              />
              {errors.confirmPassword && <span className="text-red-500 text-[10px] mt-1 block font-bold">{errors.confirmPassword.message}</span>}
            </div>
          </div>

          {/* Right Column: Actions */}
          <div className="flex-1 flex flex-col justify-center lg:pl-6 border-t lg:border-t-0 lg:border-l border-[#0011FF]/10 pt-8 lg:pt-0">

            <button type="submit" disabled={isLoading} className="w-full bg-[#0011FF] text-white text-[14px] font-bold tracking-widest py-4 rounded-[4px] hover:opacity-90 transition-opacity mb-4">
              {isLoading ? 'SIGNING UP...' : 'SIGN UP'}
            </button>

            <div className="flex justify-between items-center text-[12px] font-medium mb-12">
              <span className="text-[#0011FF]/60 font-bold">Already have an account?</span>
              <Link to="/auth/login" className="text-[#0011FF] font-black hover:underline tracking-wide">Log in</Link>
            </div>

            <div className="relative flex justify-center mb-8">
              <span className="bg-[#F0F8FF] px-4 text-xs font-bold text-[#0011FF]/60 relative z-10">Or</span>
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
                Sign up with Google
              </button>
              <button
                type="button"
                disabled={isLoading}
                className="w-full border-[1.5px] border-[#0011FF]/30 text-[#0011FF] text-xs font-bold py-3.5 rounded-[4px] hover:bg-[#0011FF]/5 transition-colors flex items-center justify-center gap-2 tracking-wide"
              >
                Sign up with Facebook
              </button>
            </div>

          </div>
        </form>
      </div>
    </AuthLayout>
  )
}
