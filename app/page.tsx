"use client"

import { useAuthStore } from "@/store/useAuthStore"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { FileUploader } from "@/components/chat/file-uploader" // <--- Import
import { ChatSidebar } from "@/components/chat/chat-sidebar"

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
    <div className="flex h-screen bg-slate-50">
     
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="max-w-2xl w-full text-center space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">
              Chat with your PDF
            </h1>
            <p className="text-lg text-slate-600">
              Upload a document and start asking questions instantly using AI.
            </p>
          </div>
          
          <FileUploader />
        </div>
      </main>
    </div>
  )
}