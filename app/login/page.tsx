"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { Loader2, Mail, CheckCircle2, RefreshCw } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
const [isEmailLoading, setIsEmailLoading] = useState(false)
  const [step, setStep] = useState<'email' | 'otp'>('email') 
  const [resendTimer, setResendTimer] = useState(0) // Timer for resend button
  const router = useRouter()
const isAnyLoading = isGoogleLoading || isEmailLoading;
  // Decrement timer
  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000)
      return () => clearInterval(interval)
    }
  }, [resendTimer])

  // 1. Send OTP (Used for initial send AND resend)
  const handleSendOtp = async (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault()
    setIsEmailLoading(true)
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true }, 
    })

    setIsEmailLoading(false)

    if (error) {
      alert("Error sending OTP: " + error.message)
    } else {
      setStep('otp')
      setResendTimer(60) // Start 60s cooldown
    }
  }

  // 2. Verify OTP
  const handleVerifyOtp = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    setIsEmailLoading(true)

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    })

    if (error) {
      alert("Invalid code: " + error.message)
      setIsEmailLoading(false)
    } else {
      router.push('/') 
    }
  }

  // 3. Google OAuth Handler
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true)
    try{

      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${location.origin}/auth/callback`,
        },
      })
    }catch{
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden p-4 font-sans">
      
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-500px h-500px bg-blue-500/20 rounded-full blur-[100px] pointer-events-none" />

      <Card className="w-full max-w-md bg-slate-900 border-slate-800 shadow-2xl shadow-black/50 relative z-10">
        <CardHeader className="text-center space-y-3 pb-6">
          <CardTitle className="text-3xl font-bold text-slate-100 tracking-tight">
            {step === 'email' ? 'Welcome Back' : 'Check your Inbox'}
          </CardTitle>
          <CardDescription className="text-slate-400 text-base">
            {step === 'email' 
              ? 'Sign in to continue to Smart Doc Chat' 
              : `We've sent a code to ${email}`
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          
          {/* --- STEP 1: EMAIL INPUT --- */}
          {step === 'email' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <Input 
                  type="email" 
                  placeholder="name@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-600 h-12"
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                disabled={isAnyLoading} 
                className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-medium text-base transition-all"
              >
                {isEmailLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                Continue with Email
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-slate-900 px-2 text-slate-500">Or continue with</span>
                </div>
              </div>

              <Button 
                type="button"
                onClick={handleGoogleLogin} 
                disabled={isAnyLoading} 
                variant="outline"
                className="w-full h-12 border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800 hover:text-white transition-all" 
              >
                {isGoogleLoading ? <Loader2 className="..." /> :
                 <svg className="mr-3 h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
                }Google
              </Button>
            </form>
          )}

          {/* --- STEP 2: OTP INPUT --- */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
               <div className="space-y-2">
                <Input 
                  type="text" 
                  placeholder="Enter 6-8 digit code" 
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-600 h-12 text-center text-lg tracking-widest letter-spacing-2"
                  maxLength={8} // Changed to 8
                  required
                  autoFocus
                />
              </div>

              <Button 
                type="submit" 
                disabled={isEmailLoading} 
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-base transition-all"
              >
                {isEmailLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Verify & Login
              </Button>
              
              <div className="flex flex-col gap-3 mt-4">
                  {/* RESEND BUTTON */}
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => handleSendOtp()}
                    disabled={resendTimer > 0 || isAnyLoading}
                    className="w-full text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    {resendTimer > 0 ? (
                        <span className="text-xs">Resend code in {resendTimer}s</span>
                    ) : (
                        <div className="flex items-center gap-2">
                           <RefreshCw className="h-3 w-3" />
                           <span>Resend Code</span>
                        </div>
                    )}
                  </Button>

                  <button 
                    type="button"
                    onClick={() => {
                        setStep('email')
                        setOtp("") // Clear OTP on back
                    }}
                    className="w-full text-sm text-slate-500 hover:text-slate-300 underline underline-offset-4"
                  >
                    Wrong email? Go back
                  </button>
              </div>
            </form>
          )}

        </CardContent>
      </Card>
      
      <div className="absolute bottom-6 text-slate-600 text-xs">
        &copy; 2026 Smart Doc Chat. All rights reserved.
      </div>
    </div>
  )
}