"use client"
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from "@/lib/supabase"
import { usePDFStore } from '@/store/pdf-store'
import PDFViewer from '@/components/pdf-viewer'
import ChatPage from '@/components/chat-page' 
import { FileText, MessageSquare } from 'lucide-react'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button";

export default function Page() {
  const params = useParams()
  const chatId = params.id as string
  
  const [activeTab, setActiveTab] = useState<'chat' | 'pdf'>('chat')
  const { setPdfUrl } = usePDFStore()
  const [isPdfOpen, setIsPdfOpen] = useState(false)
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
    setIsPdfOpen(true)
    setActiveTab('pdf')
  }

  return (
    <div className="flex h-screen w-full bg-slate-950 overflow-hidden relative">
  
  {/* BACKDROP: Only for Mobile (optional) - Removed the onClick so it won't close on click */}
  {isPdfOpen && (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] z-40 lg:hidden" />
  )}

  <div className={cn(
    "h-full flex-1 transition-all duration-500 ease-in-out z-10",
    isPdfOpen ? "lg:mr-[40%]" : "mr-0" 
  )}>
    <ChatPage onCitationClick={handleCitationClick} />
  </div>

  <aside className={cn(
    "fixed top-0 right-0 h-full bg-slate-900 border-l border-slate-800 shadow-2xl transition-transform duration-500 ease-in-out z-50",
    "w-[90%] lg:w-[40%]", 
    isPdfOpen ? "translate-x-0" : "translate-x-full"
  )}>
        
        <header className="flex h-12 items-center justify-between px-4 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-blue-500/10 rounded">
              <FileText className="h-3.5 w-3.5 text-blue-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Reference</span>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsPdfOpen(false)}
            className="text-xs text-slate-500 hover:text-white h-8"
          >
            Close
          </Button>
        </header>

        <div className="flex-1 h-[calc(100%-48px)] bg-slate-950 p-2">
          <div className="h-full w-full rounded-lg overflow-hidden bg-white shadow-inner">
            <PDFViewer />
          </div>
        </div>
      </aside>

    </div>
  )
}