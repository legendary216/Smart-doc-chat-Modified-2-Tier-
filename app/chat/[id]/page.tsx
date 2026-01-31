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
import { generateAnswer } from '@/app/actions'
import { ChatSidebar } from '@/components/chat/chat-sidebar'

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

  // 1. Fetch Chat Details & Message History
  useEffect(() => {
    const fetchChatData = async () => {
      try {
        // A. Fetch Chat Info
        const { data: chatData, error: chatError } = await supabase
          .from('chats')
          .select('file_name')
          .eq('id', chatId)
          .single()
        
        if (chatError) throw chatError
        if (chatData) setTitle(chatData.file_name)

        // B. Fetch Message History
        const { data: msgData, error: msgError } = await supabase
          .from('messages') // Accessing the table we created
          .select('*')
          .eq('chat_id', chatId)
          .order('created_at', { ascending: true })

        if (msgError) throw msgError
        if (msgData) setMessages(msgData)

      } catch (error) {
        console.error("Error loading chat history:", error)
        // Optional: Set a UI error state here if you want to show a toast
      }
    }

    fetchChatData()
  }, [chatId])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // 2. Handle Submission
  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userQuestion = input;
    setInput('')
    setIsLoading(true)

    // A. Optimistic UI update (Show user message immediately)
    const userMsgOptimistic: Message = { id: Date.now().toString(), role: 'user', content: userQuestion }
    setMessages(prev => [...prev, userMsgOptimistic])

    try {
        // B. Save User Message to DB
        // We await this to ensure data consistency, or you can fire-and-forget if speed is priority
        const { error: userMsgError } = await supabase
            .from('messages')
            .insert({ chat_id: chatId, role: 'user', content: userQuestion })
        
        if (userMsgError) throw new Error("Failed to save user message: " + userMsgError.message)

        // C. RAG Pipeline
        console.log("Searching...")
        const contextResults = await searchContext(userQuestion, chatId)
        
        const contextText = contextResults.map(c => `
        START PAGE ${c.page} BLOCK:
        ${c.content}
        END PAGE ${c.page} BLOCK
        `).join('\n\n');

        console.log("Generating answer...")
        const answer = await generateAnswer(contextText, userQuestion)

        // D. Update UI with AI Answer
        const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: answer }
        setMessages(prev => [...prev, aiMsg])

        // E. Save AI Message to DB
        const { error: aiMsgError } = await supabase
            .from('messages')
            .insert({ chat_id: chatId, role: 'assistant', content: answer })

        if (aiMsgError) throw new Error("Failed to save AI message: " + aiMsgError.message)

    } catch (err) {
        console.error("Chat Error:", err)
        // Show error in the chat bubble so the user knows something failed
        const errorMsg: Message = { id: Date.now().toString(), role: 'assistant', content: "Sorry, I encountered an error. Please try again." }
        setMessages(prev => [...prev, errorMsg])
    } finally {
        setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      
      {/* Sidebar */}
      <div className="hidden md:flex">
         <ChatSidebar currentChatId={chatId} />
      </div>

      {/* Main Chat Area */}
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
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
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
                         <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
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