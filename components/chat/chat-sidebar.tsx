"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PlusCircle, FileText, Trash2, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface Chat {
  id: string
  file_name: string
  created_at: string
}

export function ChatSidebar({ currentChatId }: { currentChatId?: string }) {
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchChats = async () => {
      try {
        setLoading(true)
        setError(null)

        // 1. Check User
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError) throw authError
        if (!user) return

        // 2. Fetch Chats
        const { data, error: dbError } = await supabase
          .from('chats')
          .select('id, file_name, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (dbError) throw dbError

        if (data) setChats(data)

      } catch (err: any) {
        console.error("Error fetching chats:", err)
        setError("Failed to load history")
      } finally {
        setLoading(false)
      }
    }

    fetchChats()
  }, [])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault() // Prevent navigation
    if(!confirm("Delete this chat?")) return

    try {
        // Optimistic update: Remove from UI immediately
        const originalChats = [...chats]
        setChats(chats.filter(c => c.id !== id))

        // Delete from DB
        const { error } = await supabase.from('chats').delete().eq('id', id)
        
        if (error) {
            // Revert UI if DB fails
            setChats(originalChats)
            throw error
        }
        
        // If we deleted the active chat, go home
        if (currentChatId === id) {
            router.push('/')
        }

    } catch (err) {
        console.error("Failed to delete chat:", err)
        alert("Could not delete chat. Please try again.")
    }
  }

  return (
    <div className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full border-r border-slate-800">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <Link href="/">
          <Button variant="secondary" className="w-full justify-start gap-2 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border-0">
            <PlusCircle className="h-4 w-4" />
            <span>New Upload</span>
          </Button>
        </Link>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Your Documents
        </div>
        
        {loading && <p className="px-4 text-sm text-slate-600 animate-pulse">Loading...</p>}
        
        {error && (
            <div className="px-4 text-sm text-red-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
            </div>
        )}

        {!loading && chats.length === 0 && !error && (
           <p className="px-4 text-sm text-slate-600">No history yet.</p>
        )}

        <div className="space-y-1 px-2">
            {chats.map((chat) => (
              <Link 
                key={chat.id} 
                href={`/chat/${chat.id}`}
                className={`
                  group flex items-center justify-between px-3 py-2 text-sm rounded-md transition-all
                  ${chat.id === currentChatId 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'hover:bg-slate-800 text-slate-400 hover:text-slate-100'}
                `}
              >
                <div className="flex items-center gap-2 truncate">
                   <FileText className="h-4 w-4 shrink-0 opacity-70" />
                   <span className="truncate max-w-140px">{chat.file_name}</span>
                </div>

                <button 
                  onClick={(e) => handleDelete(chat.id, e)}
                  className={`
                    opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity p-1
                    ${chat.id === currentChatId ? 'text-blue-200' : 'text-slate-500'}
                  `}
                >
                   <Trash2 className="h-3 w-3" />
                </button>
              </Link>
            ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-900">
         <div className="flex items-center gap-2 text-sm text-slate-500">
            <div className={`h-2 w-2 rounded-full ${error ? 'bg-red-500' : 'bg-green-500'}`}></div>
            {error ? 'Connection Error' : 'Connected'}
         </div>
      </div>
    </div>
  )
}