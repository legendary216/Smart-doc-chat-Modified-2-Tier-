"use client"

import { useAuthStore } from "@/store/useAuthStore"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

export default function Home() {
  const { session, user } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    // If no session exists, redirect to login
    // We add a small delay to allow the "initial load" to finish
    const timer = setTimeout(() => {
        if (!session) router.push("/login")
    }, 500)
    return () => clearTimeout(timer)
  }, [session, router])

  if (!session) return <div className="p-10">Checking auth...</div>

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-3xl font-bold">Hello, {user?.email}</h1>
      <p className="text-slate-500">You are securely logged in.</p>
      
      <Button variant="destructive" onClick={() => supabase.auth.signOut()}>
        Sign Out
      </Button>
    </div>
  )
}