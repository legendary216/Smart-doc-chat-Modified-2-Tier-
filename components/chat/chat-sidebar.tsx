"use client"

import Link from 'next/link'
import { Plus, MessageSquare, Trash2, AlertCircle, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { useRouter, useParams } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { cn } from "@/lib/utils"
import { useState} from 'react'
import {Loader2 } from 'lucide-react'
interface Chat {
  id: string
  file_name: string
  created_at: string
}

export function ChatSidebar() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const params = useParams()
  const currentChatId = params.id
   const [isSigningOut, setIsSigningOut] = useState(false)

  const { data: chats = [], isLoading, isError } = useQuery({
    queryKey: ['chats'],
    queryFn: async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) throw authError
      if (!user) return []

      const { data, error: dbError } = await supabase
        .from('chats')
        .select('id, file_name, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (dbError) throw dbError
      return data as Chat[]
    },
    staleTime: 1000 * 60 * 5 
  })


  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault() 
    if(!confirm("Delete this chat?")) return

    const previousChats = queryClient.getQueryData<Chat[]>(['chats'])
    queryClient.setQueryData(['chats'], (old: Chat[] = []) => {
        return old.filter(c => c.id !== id)
    })

    try {
        const { error } = await supabase.from('chats').delete().eq('id', id)
        if (error) throw error
        if (currentChatId === id) router.push('/')
    } catch (err) {
        console.error("Failed to delete chat:", err)
        alert("Could not delete chat. Please try again.")
        queryClient.setQueryData(['chats'], previousChats)
    }
  }

 

// 2. Add the sign-out handler
const handleSignOut = async () => {
  try {
    setIsSigningOut(true)
    await supabase.auth.signOut()
    router.push('/login') // Redirect after logout
  } catch (error) {
    console.error("Error signing out:", error)
  } finally {
    setIsSigningOut(false)
  }
}

  return (
    // THEME: bg-slate-900 (Slightly lighter than main bg-slate-950)
    <div className="w-full h-full bg-slate-900 flex flex-col font-sans border-r border-slate-800/50">
      
      {/* --- HEADER: Primary Action --- */}
      <div className="p-4 pb-2">
        <Link href="/" className="block">
          <Button 
            className="w-full justify-start gap-3 bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 transition-all duration-200 py-6 text-sm font-semibold rounded-xl group"
          >
            <div className="p-1 bg-white/20 rounded-md group-hover:scale-110 transition-transform">
               <Plus className="h-4 w-4" />
            </div>
            New Chat
          </Button>
        </Link>
      </div>

      {/* --- NAVIGATION LIST --- */}
      <div className="flex-1 overflow-y-auto px-3 py-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        
        <div className="space-y-2">
          {/* Typography: Clean, Uppercase Header */}
          <div className="px-3 flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-widest">
            <span>History</span>
            <span className="bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded text-[10px]">{chats.length}</span>
          </div>

          {/* Loading Skeletons */}
          {isLoading && (
            <div className="space-y-2 px-1">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-10 w-full bg-slate-800/40 rounded-lg animate-pulse" />
                ))}
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="px-3 py-3 mx-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="h-3 w-3" />
                <span>Sync failed</span>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && chats.length === 0 && !isError && (
             <div className="px-4 py-8 text-center">
                <p className="text-slate-600 text-sm">No recent chats.</p>
             </div>
          )}

          {/* Chat List Items */}
          <div className="space-y-1">
            {chats.map((chat) => {
              const isActive = chat.id === currentChatId;
              
              return (
                <Link 
                  key={chat.id} 
                  href={`/chat/${chat.id}`}
                  className={cn(
                    "group relative flex items-center justify-between px-3 py-3 rounded-lg transition-all duration-200 text-sm font-medium",
                    isActive 
                      ? "bg-blue-500/10 text-blue-400"  // Active: Tinted Blue
                      : "text-slate-400 hover:bg-slate-800 hover:text-slate-200" // Inactive
                  )}
                >
                  {/* Active Accent Bar (Left Edge) */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-3px bg-blue-500 rounded-r-full shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                  )}

                  <div className="flex items-center gap-3 overflow-hidden pl-2">
                     <MessageSquare className={cn(
                       "h-4 w-4 shrink-0 transition-colors",
                       isActive ? "text-blue-500" : "text-slate-600 group-hover:text-slate-500"
                     )} />
                     <span className="truncate max-w-140px">
                       {chat.file_name}
                     </span>
                  </div>

                  <button 
                    onClick={(e) => handleDelete(chat.id, e)}
                    className={cn(
                        "opacity-0 group-hover:opacity-100 p-1.5 rounded-md transition-all",
                        isActive 
                            ? "hover:bg-blue-500/20 text-blue-400 hover:text-blue-300"
                            : "hover:bg-slate-700 text-slate-500 hover:text-red-400"
                    )}
                    title="Delete Chat"
                  >
                     <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* --- FOOTER: User Profile --- */}
      <div className="p-4 border-t border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-slate-800/50 transition-colors group/footer">
          
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-9 w-9 shrink-0 rounded-full bg-linear-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-md ring-2 ring-slate-900">
              US
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-semibold text-slate-200 truncate">User Account</span>
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                {isError ? 'Offline' : 'Online'}
              </span>
            </div>
          </div>

          {/* Sign Out Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0"
            title="Sign Out"
          >
            {isSigningOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" height="16" 
                viewBox="0 0 24 24" fill="none" 
                stroke="currentColor" strokeWidth="2" 
                strokeLinecap="round" strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}