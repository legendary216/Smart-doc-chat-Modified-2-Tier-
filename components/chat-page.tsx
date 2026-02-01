"use client";

import { useChat } from '@ai-sdk/react';
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Send, Bot, Menu, FileText, User, Loader2 ,AlertCircle} from "lucide-react"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { useSidebar } from "@/components/app-shell";
import ReactMarkdown from "react-markdown";
import { usePDFStore } from '@/store/pdf-store';

interface DBMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// ----------------------------------------------------------------------
// 1. HELPER: Process text to find [Page X] links
// ----------------------------------------------------------------------
const CitationRenderer = ({ text, onCitationClick }: { text: string, onCitationClick?: (page: number) => void }) => {
  const parts = text.split(/(\[Page \d+\])/g);
  
  return (
    <>
      {parts.map((part, i) => {
        const match = part.match(/\[Page (\d+)\]/);
        if (match) {
          const pageNum = parseInt(match[1]);
          return (
            <button
              key={i}
              onClick={() => onCitationClick?.(pageNum)}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-1 text-xs font-medium text-blue-400 bg-blue-500/10 rounded hover:bg-blue-500/20 transition-colors cursor-pointer"
            >
              <FileText className="w-3 h-3" />
              Page {pageNum}
            </button>
          );
        }
        return part;
      })}
    </>
  );
};


// ----------------------------------------------------------------------
// 2. TYPEWRITER COMPONENT (Kept exactly as you had it)
// ----------------------------------------------------------------------


const Typewriter = ({ content, speed, onComplete }: { content: string, speed: number, onComplete?: () => void }) => {
  const [displayedContent, setDisplayedContent] = useState("");
  
  useEffect(() => {
    if (speed === 0) {
      setDisplayedContent(content);
      return;
    }
    const intervalId = setInterval(() => {
      setDisplayedContent((current) => {
        if (current.length >= content.length) {
          clearInterval(intervalId);
          return content;
        }
        return content.slice(0, current.length + 1);
      });
    }, speed);
    return () => clearInterval(intervalId);
  }, [content, speed]);

  useEffect(() => {
    if (displayedContent === content && content !== "") {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [displayedContent, content, onComplete]);
  
  return <ReactMarkdown>{displayedContent}</ReactMarkdown>;
};


// ----------------------------------------------------------------------
// 3. MAIN CHAT COMPONENT
// ----------------------------------------------------------------------
interface ChatPageProps {
  onCitationClick?: () => void;
  isPdfOpen?: boolean;
  setIsPdfOpen?: (open: boolean) => void;
}
export default function ChatPage({ 
  onCitationClick, 
  isPdfOpen, 
  setIsPdfOpen 
}: ChatPageProps){
  const params = useParams();
  const chatId = params.id as string;
  const { toggle } = useSidebar();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState("Chat");
  const [input, setInput] = useState("");
  const [finishedTypingIds, setFinishedTypingIds] = useState<Set<string>>(new Set());
  const [hasStreamed, setHasStreamed] = useState(false);

  // ZUSTAND STORE
  const { jumpToPage } = usePDFStore();

  const HARDCODED_SPEED = 15;

  useEffect(() => {
    const fetchTitle = async () => {
      const { data } = await supabase.from("chats").select("file_name").eq("id", chatId).single();
      if (data) setTitle(data.file_name);
    };
    fetchTitle();
  }, [chatId]);

  const { data: dbMessages = [], isLoading: isHistoryLoading } = useQuery({
    queryKey: ["messages", chatId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as DBMessage[];
    },
  });

  const { messages, sendMessage, status, setMessages, error } = useChat({
  onError: (err) => {
    try {
      // Try to parse the error message in case it's the JSON string we sent
      const errorObj = JSON.parse(err.message);
      console.error("Parsed Error:", errorObj.error);
    } catch (e) {
      // Fallback if the error isn't JSON
      console.error("Raw Error:", err.message);
    }
  }
});

  useEffect(() => {
    if (status === 'streaming') setHasStreamed(true);
  }, [status]);

  useEffect(() => {
    if (dbMessages.length > 0 && messages.length === 0) {
      setMessages(
        dbMessages.map((m) => ({
          id: m.id,
          role: m.role,
          parts: [{ type: 'text', text: m.content }], 
        })) as any
      );
      setFinishedTypingIds(new Set(dbMessages.map(m => m.id)));
    }
  }, [dbMessages, setMessages]); 

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, finishedTypingIds]);

  const handleSend = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const currentInput = input;
    setInput(""); 
    await sendMessage({ text: currentInput }, { body: { chatId } });
  };

  // --- HANDLER FOR CLICKING A PAGE LINK ---
  const handlePageLinkClick = (pageNumber: number) => {
    console.log("Jumping to page:", pageNumber);
    jumpToPage(pageNumber); // Tell Zustand to update PDF
    if (onCitationClick) onCitationClick(); // Tell Layout to switch tabs (Mobile)
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 text-slate-200 relative font-sans selection:bg-blue-500/30">
      
      {/* MOBILE MENU TOGGLE */}
      {/* <div className="absolute top-6 left-6 z-40 md:hidden">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggle} 
          className="text-slate-500 hover:text-white hover:bg-white/5 backdrop-blur-sm transition-all"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div> */}

   <header className="sticky top-0 z-30 h-14 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-md flex items-center transition-all">
  <div className="w-full flex items-center px-4">
    
    {/* LEFT: Menu Button */}
    <div className="flex shrink-0">
      <Button variant="ghost" size="icon" onClick={toggle} className="text-slate-500 hover:text-white">
        <Menu className="h-5 w-5" />
      </Button>
    </div>

    {/* CENTER: Title */}
    <div className="flex-1 flex justify-center px-4">
      <div className="w-full max-w-3xl flex items-center gap-3 overflow-hidden">
        <div className="p-1.5 bg-blue-500/10 rounded-md border border-blue-500/20 shrink-0">
          <FileText className="h-3.5 w-3.5 text-blue-400" />
        </div>
        <h1 className="font-medium text-slate-200 truncate text-xs tracking-tight">
          {title}
        </h1>
      </div>
    </div>

    {/* RIGHT: NEW VIEW DOCUMENT BUTTON */}
    <div className="flex shrink-0">
      {!isPdfOpen && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setIsPdfOpen?.(true)}
          className="h-8 border-slate-800 bg-slate-900/50 text-slate-400 hover:text-blue-400 hover:border-blue-500/50 transition-all gap-2 text-[10px] font-bold uppercase tracking-widest px-3"
        >
          <FileText className="h-3 w-3" />
          View PDF
        </Button>
      )}
    </div>

  </div>
</header>
      {/* Improved Scrollable Area */}
      <main className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        
        <div className="w-full max-w-3xl mx-auto px-4 py-12 space-y-12">
          
          {isHistoryLoading && messages.length === 0 && (
             <div className="flex flex-col items-center justify-center space-y-4 py-20">
                <Loader2 className="h-5 w-5 animate-spin text-blue-500/50" />
                <p className="text-xs text-slate-500 font-medium tracking-widest uppercase">Initializing History</p>
             </div>
          )}

          {messages.map((m, index) => {
             const isLastMessage = index === messages.length - 1;
             const isAssistant = m.role === 'assistant';
             const hasFinishedTyping = finishedTypingIds.has(m.id);
             const useTypewriter = isAssistant && isLastMessage && !hasFinishedTyping && hasStreamed;

             return (
              <div 
                key={m.id} 
                className={`flex w-full animate-in fade-in slide-in-from-bottom-3 duration-500 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex gap-4 w-full ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div className="shrink-0">
                    {m.role === "assistant" ? (
                      <div className="h-8 w-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                        <Bot className="h-4 w-4 text-blue-400" />
                      </div>
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                        <User className="h-4 w-4 text-slate-400" />
                      </div>
                    )}
                  </div>

                  <div className={`
                    relative max-w-[85%] leading-relaxed text-[15px]
                    ${m.role === "user" 
                      ? "bg-slate-800/80 backdrop-blur-sm text-slate-100 px-4 py-2.5 rounded-2xl rounded-tr-sm border border-slate-700/50 shadow-sm" 
                      : "text-slate-300 pt-1.5"
                    }
                  `}>
                    {m.parts.map((part, partIndex) => {
                      if (part.type !== 'text') return null;
                      if (m.role === "user") return <span key={partIndex}>{part.text}</span>;

                      // THIS IS WHERE WE INJECT THE CITATION CLICKER
                      return (
                        <div key={partIndex} className="prose prose-invert prose-p:leading-7 prose-li:text-slate-300 prose-strong:text-white prose-headings:text-slate-100 max-w-none">
                          {useTypewriter ? (
                            <Typewriter 
                              content={part.text} 
                              speed={HARDCODED_SPEED}
                              onComplete={() => setFinishedTypingIds(prev => new Set(prev).add(m.id))} 
                            />
                          ) : (
                            <ReactMarkdown
                                components={{
                                    // Override paragraph to render our buttons
                                    p: ({node, children}) => {
                                        return <p className="mb-4">
                                            {/* We iterate through children to find text nodes and replace [Page X] */}
                                            {Array.isArray(children) 
                                                ? children.map((child, i) => {
                                                    if (typeof child === 'string') {
                                                        return <CitationRenderer key={i} text={child} onCitationClick={handlePageLinkClick} />
                                                    }
                                                    return child;
                                                })
                                                : (typeof children === 'string' ? <CitationRenderer text={children} onCitationClick={handlePageLinkClick} /> : children)
                                            }
                                        </p>
                                    }
                                }}
                            >
                                {part.text}
                            </ReactMarkdown>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          {(status === 'submitted' || (status === 'streaming' && messages[messages.length - 1]?.role !== 'assistant')) && (
            <div className="flex justify-start w-full animate-pulse">
               <div className="flex gap-4 items-center">
                  <div className="h-8 w-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
                     <Bot className="h-4 w-4 text-blue-500/50" />
                  </div>
                  <span className="text-xs text-slate-500 font-medium tracking-widest uppercase">Thinking</span>
               </div>
            </div>
          )}
          {error && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-400">
                    {error.message.includes('429') 
                      ? "Gemini quota exhausted. Please wait a moment before trying again." 
                      : "Something went wrong. Please check your connection."}
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => window.location.reload()}
                  className="text-xs text-red-400 hover:bg-red-500/10 h-8"
                >
                  Retry
                </Button>
              </div>
            </div>
          )}
          
          <div ref={scrollRef} className="h-20 w-full" />
        </div>
      </main>

      <div className="absolute bottom-0 left-0 right-0 p-1 bg-linear-to-t from-slate-950 via-slate-950 to-transparent pointer-events-none">
        <div className="max-w-3xl mx-auto mb-6 pointer-events-auto">
          <form 
            onSubmit={handleSend} 
            className="group relative flex items-center gap-2 bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-2 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all focus-within:border-blue-500/40 focus-within:ring-1 focus-within:ring-blue-500/20"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              className="flex-1 border-0 bg-transparent text-slate-200 placeholder:text-slate-600 px-4 focus-visible:ring-0 h-10 text-[15px]"
              disabled={status !== 'ready' && status !== 'error'}
              autoFocus
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={status !== 'ready' && status !== 'error'}
              className={`
                  h-9 w-9 rounded-xl transition-all duration-300 shrink-0 mr-1
                  ${input.trim() 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 scale-100' 
                    : 'bg-slate-800 text-slate-600 scale-95 opacity-50'
                  }
              `}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <p className="text-center text-[10px] text-slate-600 mt-4 tracking-tight">
            AI-generated content may be inaccurate.
          </p>
        </div>
      </div>
    </div>
  );
}