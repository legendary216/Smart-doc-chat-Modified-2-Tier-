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
  {/* CONTENT WRAPPER */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* LEFT: CHAT (Primary Focus - 70%) */}
        <div className={cn(
          "h-full w-full md:w-[60%] transition-all duration-300 ease-in-out z-20",
          activeTab === 'pdf' ? "hidden md:block" : "block"
        )}>
          <ChatPage onCitationClick={handleCitationClick} />
        </div>

        {/* RIGHT: PDF (Secondary Focus - 30%) */}
        <div className={cn(
          "h-full w-full md:w-[40%] bg-slate-900 flex flex-col transition-all duration-300 ease-in-out border-l border-slate-800",
          activeTab === 'chat' ? "hidden md:flex" : "flex"
        )}>
          
          {/* Subtle Aesthetic Header */}
          <header className="flex h-12 shrink-0 items-center px-4 border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-blue-500/10 rounded">
                <FileText className="h-3.5 w-3.5 text-blue-400" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Document</span>
            </div>
          </header>

          {/* PDF Frame: Adding padding makes it look like a physical sheet */}
          <div className="flex-1 p-3 bg-slate-950/50 overflow-hidden">
            <div className="h-full w-full rounded-xl overflow-hidden shadow-2xl ring-1 ring-slate-800 bg-white">
              <PDFViewer />
            </div>
          </div>
          
        </div>

      </div>
    </div>
  )
}