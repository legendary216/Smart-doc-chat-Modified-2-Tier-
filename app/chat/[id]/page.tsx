"use client"

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Send, ArrowLeft, MoreVertical, Paperclip, Bot, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import Link from 'next/link'
import { searchContext } from '@/lib/search'
import { generateAnswer } from '@/app/actions' // <--- Import Server Action

// Define Message Type locally
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
  
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchChat = async () => {
      const { data, error } = await supabase
        .from('chats')
        .select('file_name')
        .eq('id', chatId)
        .single()

      if (data) setTitle(data.file_name)
      if (error) console.error("Error fetching chat:", error)
    }
    fetchChat()
  }, [chatId])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // --- HANDLER ---
  // We use React.FormEvent<HTMLFormElement> for strict React 19 compliance
  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userQuestion = input;
    
    // 1. Optimistic UI
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: userQuestion }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
        // 2. Retrieve Context (Client-Side)
       console.log("Searching...")
        const contextResults = await searchContext(userQuestion, chatId)
        console.log("contextResults : ",contextResults);
        
        // --- CRITICAL FIX: Include Page Numbers in the context sent to AI ---
        const contextText = contextResults.map(c => `
        SOURCE (Page ${c.page}):
        ${c.content}
        `).join('\n\n---\n\n');

        // 3. Generate Answer
        console.log("Generating answer...")
        const answer = await generateAnswer(contextText, userQuestion)

        // 4. Show Result
        const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: answer }
        setMessages(prev => [...prev, aiMsg])

    } catch (err) {
        console.error(err)
        const errorMsg: Message = { id: Date.now().toString(), role: 'assistant', content: "Sorry, something went wrong." }
        setMessages(prev => [...prev, errorMsg])
    } finally {
        setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
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

      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b bg-white flex items-center justify-between px-6 shadow-sm">
            <h1 className="font-semibold text-slate-800 flex items-center gap-2">
                <span className="md:hidden"><Link href="/"><ArrowLeft className="h-4 w-4"/></Link></span>
                {title}
            </h1>
            <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
        </header>

        <ScrollArea className="flex-1 p-4 bg-slate-50">
            <div className="max-w-3xl mx-auto space-y-6 pb-4">
                {messages.length === 0 && (
                    <div className="text-center text-slate-400 mt-20">
                        <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium text-slate-600">Ask me anything about this document!</h3>
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