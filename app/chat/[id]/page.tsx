"use client"

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

import { Send, ArrowLeft, MoreVertical, Paperclip, Bot, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import Link from 'next/link'
import { searchContext } from '@/lib/search' // <--- Import our search logic

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatPage() {
  const params = useParams()
  const chatId = params.id as string
  
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [title, setTitle] = useState('Chat')
  
  // Auto-scroll to bottom ref
  const scrollRef = useRef<HTMLDivElement>(null)

  // 1. Fetch Chat Metadata on Load
  useEffect(() => {
    const fetchChat = async () => {
      const { data, error } = await supabase
        .from('chats') // Note: lowercase table name
        .select('file_name')
        .eq('id', chatId)
        .single()

      if (data) setTitle(data.file_name)
      if (error) console.error("Error fetching chat:", error)
    }
    fetchChat()
  }, [chatId])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // 2. Handle Sending a Message
  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userQuestion = input;
    
    // A. Optimistic UI (Show user message immediately)
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: userQuestion }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
        // B. Perform Retrieval (The "R" in RAG)
        console.log("Searching for context...")
        // This runs the embedding + vector search
        const context = await searchContext(userQuestion, chatId)
        console.log("Found chunks:", context)

        // C. Construct the Response (Temporary: Just showing what we found)
        // In the next phase, we will send this to Gemini to "summarize"
        let aiResponseContent = ""
        
        if (context.length > 0) {
            aiResponseContent = "**I found this relevant information:**\n\n" + 
            context.map(c => `> *Page ${c.page}*: "${c.content.substring(0, 150)}..."`).join('\n\n')
        } else {
            aiResponseContent = "I searched the document, but couldn't find any relevant information."
        }

        const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: aiResponseContent }
        setMessages(prev => [...prev, aiMsg])

    } catch (err) {
        console.error(err)
        const errorMsg: Message = { id: Date.now().toString(), role: 'assistant', content: "Sorry, I encountered an error while searching." }
        setMessages(prev => [...prev, errorMsg])
    } finally {
        setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* --- SIDEBAR --- */}
      <div className="w-64 bg-slate-900 text-slate-300 p-4 flex-col hidden md:flex">
        <div className="mb-6">
            <Link href="/" className="flex items-center gap-2 hover:text-white transition-colors">
                <ArrowLeft className="h-4 w-4" />
                <span className="font-semibold">Back to Home</span>
            </Link>
        </div>
        <div className="flex-1">
            <p className="text-xs font-bold text-slate-500 uppercase mb-4">Current Document</p>
            <div className="flex items-center gap-2 p-2 bg-slate-800 rounded-md text-sm text-white">
                <Paperclip className="h-4 w-4 text-blue-400" />
                <span className="truncate">{title}</span>
            </div>
        </div>
      </div>

      {/* --- MAIN CHAT AREA --- */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b bg-white flex items-center justify-between px-6 shadow-sm">
            <h1 className="font-semibold text-slate-800 flex items-center gap-2">
                <span className="md:hidden"><Link href="/"><ArrowLeft className="h-4 w-4"/></Link></span>
                {title}
            </h1>
            <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
        </header>

        {/* Messages List */}
        <ScrollArea className="flex-1 p-4 bg-slate-50">
            <div className="max-w-3xl mx-auto space-y-6 pb-4">
                {messages.length === 0 && (
                    <div className="text-center text-slate-400 mt-20">
                        <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium text-slate-600">Ask me anything about this document!</h3>
                        <p className="text-sm">I use local AI to find the answer.</p>
                    </div>
                )}
                
                {messages.map(m => (
                    <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {m.role === 'assistant' && (
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                <Bot className="h-5 w-5 text-blue-600" />
                            </div>
                        )}
                        
                        <div className={`
                            max-w-[80%] rounded-2xl p-4 text-sm whitespace-pre-wrap
                            ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border shadow-sm text-slate-800'}
                        `}>
                            {m.content}
                        </div>

                        {m.role === 'user' && (
                            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                                <User className="h-5 w-5 text-slate-600" />
                            </div>
                        )}
                    </div>
                ))}

                {isLoading && (
                    <div className="flex gap-3 justify-start">
                         <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                <Bot className="h-5 w-5 text-blue-600" />
                         </div>
                         <div className="bg-white border shadow-sm rounded-2xl p-4 text-sm text-slate-500 italic flex items-center gap-2">
                            <span className="animate-pulse">Thinking...</span>
                         </div>
                    </div>
                )}
                <div ref={scrollRef} />
            </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 bg-white border-t">
            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-2">
                <Input 
                    value={input} 
                    onChange={e => setInput(e.target.value)} 
                    placeholder="Ask a question..." 
                    className="flex-1"
                    disabled={isLoading}
                />
                <Button type="submit" disabled={isLoading}>
                    <Send className="h-4 w-4" />
                </Button>
            </form>
        </div>
      </div>
    </div>
  )
}