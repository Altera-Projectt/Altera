import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2 } from 'lucide-react'
import logoSvg from '@/assets/logo2.png'
import { toast } from 'sonner'

const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
})



const passwordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [isLoading, setIsLoading] = useState(false)
  const [, setEmail] = useState('')
  const [code, setCode] = useState(['', '', '', '', '', ''])

  // Step 1: Email Form
  const { register: registerEmail, handleSubmit: handleEmailSubmit, formState: { errors: emailErrors } } = useForm({
    resolver: zodResolver(emailSchema),
  })

  // Step 3: Password Form
  const { register: registerPassword, handleSubmit: handlePasswordSubmit, formState: { errors: passwordErrors } } = useForm({
    resolver: zodResolver(passwordSchema),
  })

  const onEmailSubmit = async (data: any) => {
    setIsLoading(true)
    setEmail(data.email)
    // MOCK API CALL
    setTimeout(() => {
      setIsLoading(false)
      setStep(2)
      toast.success('Verification code sent to your email.')
    }, 1000)
  }

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return // only 1 char per box
    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)
    
    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`)
      nextInput?.focus()
    }
  }

  const onCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const fullCode = code.join('')
    if (fullCode.length < 6) {
      toast.error('Please enter the complete 6-digit code.')
      return
    }
    setIsLoading(true)
    // MOCK API CALL
    setTimeout(() => {
      setIsLoading(false)
      setStep(3)
    }, 1000)
  }

  const onPasswordSubmit = async () => {
    setIsLoading(true)
    // MOCK API CALL
    setTimeout(() => {
      setIsLoading(false)
      setStep(4)
    }, 1000)
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
          {/* Thin blue border as requested, no thick black shadow */}
          <div className="flex-1 w-full md:w-auto mt-8 md:mt-0 flex items-center justify-center z-10 relative">
            <div className="bg-[#F4F6F9] w-full h-full max-h-[520px] rounded-[8px] shadow-lg flex flex-col p-8 lg:p-12 relative overflow-hidden border-[1.5px] border-[#0011FF]/50">
              
              {step === 1 && (
                <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-500">
                  <h2 className="text-[2.25rem] font-bold text-[#0011FF] mb-4 font-heading tracking-tight uppercase">Forgot password</h2>
                  <p className="text-[11px] text-[#0011FF]/80 mb-8 leading-relaxed max-w-[280px] font-medium">
                    Please enter your registered email ID.<br/>
                    We will send a verification code to your registered email ID.
                  </p>

                  <form onSubmit={handleEmailSubmit(onEmailSubmit)} className="space-y-6 flex-1 flex flex-col">
                    <div>
                      <label className="text-[10px] text-[#0011FF] font-bold block mb-1.5 uppercase">Your email</label>
                      <input 
                        type="email" 
                        {...registerEmail('email')}
                        className="w-full border border-[#0011FF]/30 rounded-[4px] px-4 py-3 text-sm text-black outline-none focus:border-[#0011FF] transition-colors bg-white font-light"
                      />
                      {emailErrors.email && <span className="text-red-500 text-[10px] mt-1 block">{emailErrors.email.message as string}</span>}
                    </div>
                    
                    <div className="mt-auto pt-8">
                      <button type="submit" disabled={isLoading} className="w-full bg-[#0011FF] text-white text-[13px] font-bold tracking-widest py-4 rounded-[4px] hover:opacity-90 transition-opacity">
                        {isLoading ? 'SENDING...' : 'NEXT'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {step === 2 && (
                <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-500">
                  <h2 className="text-[2.25rem] font-bold text-[#0011FF] mb-4 font-heading tracking-tight uppercase">Forgot password</h2>
                  <p className="text-[11px] text-[#0011FF]/80 mb-8 leading-relaxed max-w-[280px] font-medium">
                    Please enter your verification code.<br/>
                    We have sent a verification code to your registered email ID.
                  </p>

                  <form onSubmit={onCodeSubmit} className="space-y-6 flex-1 flex flex-col">
                    <div className="flex items-center gap-3">
                      {code.map((digit, idx) => (
                        <input 
                          key={idx}
                          id={`code-${idx}`}
                          type="text" 
                          value={digit}
                          onChange={(e) => handleCodeChange(idx, e.target.value)}
                          className="w-12 h-12 border border-[#0011FF]/30 rounded-[4px] text-center text-lg font-bold text-black outline-none focus:border-[#0011FF] transition-colors bg-white"
                        />
                      ))}
                    </div>
                    
                    <div className="mt-auto pt-8">
                      <button type="submit" disabled={isLoading} className="w-full bg-[#0011FF] text-white text-[13px] font-bold tracking-widest py-4 rounded-[4px] hover:opacity-90 transition-opacity">
                        {isLoading ? 'VERIFYING...' : 'DONE'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {step === 3 && (
                <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-500">
                  <h2 className="text-[2.25rem] font-bold text-[#0011FF] mb-4 font-heading tracking-tight uppercase">Forgot password</h2>
                  <p className="text-[11px] text-[#0011FF]/80 mb-8 leading-relaxed max-w-[280px] font-medium">
                    Please enter your new password.
                  </p>

                  <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-6 flex-1 flex flex-col">
                    <div>
                      <label className="text-[10px] text-[#0011FF] font-bold block mb-1.5 uppercase">New password</label>
                      <input 
                        type="password" 
                        {...registerPassword('password')}
                        className="w-full border border-[#0011FF]/30 rounded-[4px] px-4 py-3 text-sm text-black outline-none focus:border-[#0011FF] transition-colors bg-white font-light"
                      />
                      {passwordErrors.password && <span className="text-red-500 text-[10px] mt-1 block">{passwordErrors.password.message as string}</span>}
                    </div>
                    <div>
                      <label className="text-[10px] text-[#0011FF] font-bold block mb-1.5 uppercase">Re-enter password</label>
                      <input 
                        type="password" 
                        {...registerPassword('confirmPassword')}
                        className="w-full border border-[#0011FF]/30 rounded-[4px] px-4 py-3 text-sm text-black outline-none focus:border-[#0011FF] transition-colors bg-white font-light"
                      />
                      {passwordErrors.confirmPassword && <span className="text-red-500 text-[10px] mt-1 block">{passwordErrors.confirmPassword.message as string}</span>}
                    </div>
                    
                    <div className="mt-auto pt-8">
                      <button type="submit" disabled={isLoading} className="w-full bg-[#0011FF] text-white text-[13px] font-bold tracking-widest py-4 rounded-[4px] hover:opacity-90 transition-opacity">
                        {isLoading ? 'SAVING...' : 'SAVE'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {step === 4 && (
                <div className="flex flex-col items-center justify-center h-full text-center animate-in fade-in zoom-in-95 duration-500">
                  <CheckCircle2 className="w-16 h-16 text-[#0011FF] mb-6" />
                  <h2 className="text-[2.25rem] font-bold text-[#0011FF] mb-4 font-heading tracking-tight uppercase">Reset password</h2>
                  <p className="text-[11px] text-[#0011FF]/80 mb-8 leading-relaxed max-w-[250px] font-medium">
                    Your password has been successfully changed, please use your new password to log in.
                  </p>
                  <div className="w-full mt-auto pt-8">
                    <button 
                      onClick={() => navigate('/auth/login')}
                      className="w-full bg-[#0011FF] text-white text-[13px] font-bold tracking-widest py-4 rounded-[4px] hover:opacity-90 transition-opacity"
                    >
                      LOG IN
                    </button>
                  </div>
                </div>
              )}

              {/* Footer link (only show on step 1) */}
              {step === 1 && (
                <div className="mt-8 flex justify-center text-[10px] text-[#0011FF] font-bold tracking-tight">
                  <Link to="/auth/login" className="opacity-60 hover:opacity-100 transition-opacity flex items-center gap-1 font-medium">
                    &larr; Back to Log in
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
