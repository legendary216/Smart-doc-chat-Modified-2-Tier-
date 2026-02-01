"use client"
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from "@/lib/supabase"
import { usePDFStore } from '@/store/pdf-store'
import PDFViewer from '@/components/pdf-viewer'
import ChatPage from '@/components/chat-page' 
import { FileText, MessageSquare } from 'lucide-react'
import { cn } from "@/lib/utils"

export default function Page() {
  const params = useParams()
  const chatId = params.id as string
  
  const [activeTab, setActiveTab] = useState<'chat' | 'pdf'>('chat')
  const { setPdfUrl } = usePDFStore()

  // ---------------------------------------------------------
  // 1. FETCH FILENAME AND GENERATE URL
  // ---------------------------------------------------------
  useEffect(() => {
    const fetchChatData = async () => {
      if (!chatId) return

      // A. Get the filename from the DB
      const { data, error } = await supabase
        .from('chats')
        .select('file_name') // <--- FIXED: using your actual column name
        .eq('id', chatId)
        .single()

      if (error) {
        console.error("Error fetching chat:", error)
        return
      }

      if (data?.file_name) {
        // B. Convert "sample2.pdf" into a real URL
        // ⚠️ REPLACE 'pdfs' WITH YOUR ACTUAL STORAGE BUCKET NAME
        // (Check your Supabase Dashboard > Storage to see the bucket name)
        const { data: urlData } = supabase
          .storage
          .from('pdfs') 
          .getPublicUrl(data.file_name)

        if (urlData.publicUrl) {
          console.log("Loading PDF from:", urlData.publicUrl)
          setPdfUrl(urlData.publicUrl)
        }
      }
    }

    fetchChatData()
  }, [chatId, setPdfUrl])


  // Helper: Switch tabs on mobile when citation is clicked
  const handleCitationClick = () => {
    setActiveTab('pdf')
  }

  return (
    <div className="flex h-screen flex-col bg-slate-950 text-slate-200 md:flex-row">
      
      {/* MOBILE TABS */}
      <div className="flex h-12 shrink-0 items-center border-b border-slate-800 bg-slate-950 md:hidden">
        <button
          onClick={() => setActiveTab('chat')}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 border-b-2 py-3 text-sm font-medium transition-colors",
            activeTab === 'chat' ? "border-blue-500 text-blue-500" : "border-transparent text-slate-400 hover:text-slate-200"
          )}
        >
          <MessageSquare className="h-4 w-4" />
          Chat
        </button>
        <button
          onClick={() => setActiveTab('pdf')}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 border-b-2 py-3 text-sm font-medium transition-colors",
            activeTab === 'pdf' ? "border-blue-500 text-blue-500" : "border-transparent text-slate-400 hover:text-slate-200"
          )}
        >
          <FileText className="h-4 w-4" />
          Document
        </button>
      </div>

      {/* CONTENT */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* LEFT: CHAT */}
        <div className={cn(
          "h-full w-full md:w-[45%] lg:w-[40%] md:border-r border-slate-800",
          activeTab === 'pdf' ? "hidden md:block" : "block"
        )}>
          <ChatPage onCitationClick={handleCitationClick} />
        </div>

        {/* RIGHT: PDF */}
        <div className={cn(
          "flex flex-col h-full w-full md:w-[55%] lg:w-[60%] bg-slate-100",
          activeTab === 'chat' ? "hidden md:flex" : "flex"
        )}>
           {/* Right Header */}
           <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm z-10">
            <div className="flex items-center gap-2 text-slate-700">
              <FileText className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-medium">Original Document</span>
            </div>
          </header>

          <div className="flex-1 relative w-full overflow-hidden">
            <PDFViewer />
          </div>
        </div>

      </div>
    </div>
  )
}