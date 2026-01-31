"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"
import { useState } from "react"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async () => {
    setIsLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    })
  }

  return (
    // 1. Dark Theme Atmosphere: bg-slate-950
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden p-4">
      
      {/* 2. The "Glow" Effect */}
      {/* A large, blurred blue orb behind the card to create depth */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-500px h-500px bg-blue-500/20 rounded-full blur-[100px] pointer-events-none" />

      {/* 3. Card Refinement */}
      <Card className="w-full max-w-md bg-slate-900 border-slate-800 shadow-2xl shadow-black/50 relative z-10">
        <CardHeader className="text-center space-y-3 pb-8">
          
          {/* Typography Upgrade */}
          <CardTitle className="text-3xl font-bold text-slate-100 tracking-tight">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-slate-400 text-base">
            Sign in to your account to continue
          </CardDescription>
        
        </CardHeader>
        <CardContent className="pb-8">
          {/* 4. Google Button Upgrade (Option A: High Contrast) */}
          <Button 
            onClick={handleLogin} 
            disabled={isLoading} 
            className="w-full h-12 text-base font-medium bg-white text-slate-900 hover:bg-slate-100 hover:shadow-lg transition-all duration-200 border-0" 
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin text-slate-900" />
            ) : (
              // Google Icon
              <svg className="mr-3 h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
              </svg>
            )}
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
      
      {/* Optional: Simple Footer Text */}
      <div className="absolute bottom-6 text-slate-600 text-xs">
        &copy; 2024 Smart Doc Chat. All rights reserved.
      </div>
    </div>
  )
}