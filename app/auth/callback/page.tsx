"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { searchParams } = new URL(window.location.href)
      const code = searchParams.get('code')

      if (code) {
        await supabase.auth.exchangeCodeForSession(code)
      }
      
      router.push('/')
    }

    handleAuthCallback()
  }, [router])

  return (
    // 1. Dark Background with overflow hidden for the glow effect
    <div className="flex h-screen w-full items-center justify-center bg-slate-950 relative overflow-hidden">
      
      {/* 2. Visual Depth: The "Spotlight" Glow Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-500px h-500px bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* 3. Content Container (Z-index ensures it sits above the glow) */}
      <div className="relative z-10 flex flex-col items-center gap-6 p-8 rounded-2xl bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 shadow-2xl">
        
        {/* Vibrant Loader */}
        <div className="p-3 bg-slate-900 rounded-full border border-slate-800 shadow-inner">
           <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
        
        <div className="text-center space-y-2">
           {/* Primary Text */}
           <h3 className="font-semibold text-lg text-slate-200 tracking-tight">
             Finalizing login...
           </h3>
           
           {/* Secondary Text */}
           <p className="text-sm text-slate-500">
             Please wait while we secure your session
           </p>
        </div>
      </div>
    </div>
  )
}