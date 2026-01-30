"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'
import { FileUploader } from "@/components/chat/file-uploader"

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    // The AuthProvider in layout.tsx is already listening for the session.
    // However, sometimes we need to manually exchange the code for a session 
    // if the auto-detection is slow or using PKCE flow.
    const handleAuthCallback = async () => {
      // 1. Check if the URL contains a code (PKCE flow)
      const { searchParams } = new URL(window.location.href)
      const code = searchParams.get('code')

      if (code) {
        // Exchange the code for a session
        await supabase.auth.exchangeCodeForSession(code)
      }
      
      // 2. Redirect to home immediately
      // The global AuthProvider will detect the new session and update the UI
      router.push('/')
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <h3 className="font-semibold text-slate-700">Finalizing login...</h3>
      </div>
    </div>
  )
}