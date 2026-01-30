"use client"

import { useAuthStore } from "@/store/useAuthStore"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { FileUploader } from "@/components/chat/file-uploader" // <--- Import

export default function Home() {
  const { session, user } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
        if (!session) router.push("/login")
    }, 500)
    return () => clearTimeout(timer)
  }, [session, router])

  if (!session) return <div className="p-10">Checking auth...</div>

  return (
    <div className="flex flex-col items-center pt-20 min-h-screen bg-slate-50 gap-8">
      
      {/* Header Section */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">Chat with your Data</h1>
        <p className="text-slate-500">Upload a PDF to get started</p>
      </div>

      {/* The New Feature */}
      <FileUploader />

      {/* Footer Info */}
      <div className="absolute bottom-4 text-xs text-slate-400">
        Logged in as {user?.email} • 
        <button onClick={() => supabase.auth.signOut()} className="ml-2 underline hover:text-slate-600">
          Sign Out
        </button>
      </div>
    </div>
  )
}