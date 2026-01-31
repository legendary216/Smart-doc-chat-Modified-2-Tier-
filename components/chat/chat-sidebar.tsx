"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MessageSquare, PlusCircle, FileText, Trash2 } from 'lucide-react'
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
  const router = useRouter()

  useEffect(() => {
    const fetchChats = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('chats')
        .select('id, file_name, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (data) setChats(data)
    }

    fetchChats()
  }, [])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault() // Prevent navigation
    if(!confirm("Delete this chat?")) return

    await supabase.from('chats').delete().eq('id', id)
    setChats(chats.filter(c => c.id !== id))
    
    if (currentChatId === id) {
        router.push('/')
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
        
        {chats.length === 0 ? (
           <p className="px-4 text-sm text-slate-600">No history yet.</p>
        ) : (
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
                   <FileText className="h-4 w-4 flex-shrink-0 opacity-70" />
                   <span className="truncate max-w-[140px]">{chat.file_name}</span>
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
        )}
      </div>

      {/* User Info (Footer) */}
      <div className="p-4 border-t border-slate-800 bg-slate-900">
         <div className="flex items-center gap-2 text-sm text-slate-500">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            Connected
         </div>
      </div>
    </div>
  )
}