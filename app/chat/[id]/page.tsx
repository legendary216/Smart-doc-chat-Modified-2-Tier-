"use client";

import { useChat } from '@ai-sdk/react';
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Send, Bot, Menu, ArrowLeft, Loader2, Sparkles } from "lucide-react"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useSidebar } from "@/components/app-shell";
import ReactMarkdown from "react-markdown";

interface DBMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// --- TYPEWRITER COMPONENT (Logic Unchanged) ---
const Typewriter = ({ content, speed, onComplete }: { content: string, speed: number, onComplete?: () => void }) => {
  const [displayedContent, setDisplayedContent] = useState("");
  
  useEffect(() => {
    if (speed === 0) {
      setDisplayedContent(content);
      if (onComplete) onComplete();
      return;
    }
    const intervalId = setInterval(() => {
      setDisplayedContent((current) => {
        if (current.length >= content.length) {
          clearInterval(intervalId);
          if (onComplete) onComplete();
          return content;
        }
        return content.slice(0, current.length + 1);
      });
    }, speed);
    return () => clearInterval(intervalId);
  }, [content, speed, onComplete]);

  return <ReactMarkdown>{displayedContent}</ReactMarkdown>;
};

export default function ChatPage() {
  const params = useParams();
  const chatId = params.id as string;
  const { toggle } = useSidebar();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState("Chat");
  
  const [input, setInput] = useState("");
  const [finishedTypingIds, setFinishedTypingIds] = useState<Set<string>>(new Set());
  const [hasStreamed, setHasStreamed] = useState(false);

  // 10 = Very Fast, 30 = Normal, 50 = Slow
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

  const { messages, sendMessage, status, setMessages } = useChat();

  useEffect(() => {
    if (status === 'streaming') {
      setHasStreamed(true);
    }
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

    await sendMessage(
      { text: currentInput },
      { body: { chatId } } 
    );
  };

  return (
    // DARK MODE BASE: bg-slate-950
    <div className="flex flex-col h-full w-full bg-slate-950 text-slate-100 relative">
      
      {/* --- HEADER (Dark Glass) --- */}
      <header className="sticky top-0 z-10 h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md flex items-center justify-between px-4 md:px-6 shadow-sm transition-all">
        <div className="flex items-center gap-3 overflow-hidden">
          {/* Toggle Sidebar Button */}
          <Button variant="ghost" size="icon" onClick={toggle} className="shrink-0 text-slate-400 hover:text-slate-200 hover:bg-slate-800">
            <Menu className="h-5 w-5" />
          </Button>

          {/* Title & Back Link */}
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="md:hidden shrink-0">
              <Link href="/" className="text-slate-400 hover:text-slate-200">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </span>
            <h1 className="font-semibold text-slate-100 truncate text-sm md:text-base max-w-[200px] md:max-w-md">
              {title}
            </h1>
          </div>
        </div>
      </header>

      {/* --- CHAT AREA --- */}
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-6 md:py-8 scroll-smooth scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        <div className="max-w-3xl mx-auto space-y-8 pb-4">
          
          {/* Loading State */}
          {isHistoryLoading && messages.length === 0 && (
             <div className="flex flex-col items-center justify-center space-y-3 py-10 opacity-60">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <p className="text-sm text-slate-500 font-medium">Loading conversation...</p>
             </div>
          )}

          {/* Empty State / Start */}
          {!isHistoryLoading && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center space-y-4 py-20 px-4">
               <div className="h-16 w-16 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center mb-2 shadow-inner">
                 <Sparkles className="h-8 w-8 text-blue-500" />
               </div>
               <h2 className="text-xl font-semibold text-slate-100">Ready to help!</h2>
               <p className="text-slate-400 max-w-sm">
                 Ask me anything about your document. I'll cite page numbers for accuracy.
               </p>
            </div>
          )}

          {/* Messages Loop */}
          {messages.map((m, index) => {
             const isLastMessage = index === messages.length - 1;
             const isAssistant = m.role === 'assistant';
             const hasFinishedTyping = finishedTypingIds.has(m.id);
             const useTypewriter = isAssistant && isLastMessage && !hasFinishedTyping && hasStreamed;

             return (
              <div 
                key={m.id} 
                className={`group flex w-full gap-4 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {/* Assistant Avatar (Dark Mode) */}
                {m.role === "assistant" && (
                  <div className="hidden sm:flex h-8 w-8 rounded-full bg-slate-900 border border-slate-800 shadow-sm items-center justify-center shrink-0 mt-1">
                    <Bot className="h-4 w-4 text-blue-500" />
                  </div>
                )}
                
                {/* Message Bubble */}
                <div 
                  className={`
                    relative max-w-[85%] md:max-w-[75%] px-5 py-3.5 text-sm shadow-sm
                    ${m.role === "user" 
                      ? "bg-blue-600 text-white rounded-2xl rounded-tr-sm"  // Keep User Blue
                      : "bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl rounded-tl-sm" // Dark AI Bubble
                    }
                  `}
                >
                  {m.parts.map((part, partIndex) => {
                    if (part.type !== 'text') return null;
                    
                    if (m.role === "user") {
                      return <span key={partIndex} className="leading-relaxed">{part.text}</span>;
                    }

                    return (
                      // Added 'prose-invert' to make text white
                      <div key={partIndex} className="prose prose-sm prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800 prose-pre:text-slate-200">
                        {useTypewriter ? (
                          <Typewriter 
                            content={part.text} 
                            speed={HARDCODED_SPEED}
                            onComplete={() => {
                              setFinishedTypingIds(prev => new Set(prev).add(m.id));
                            }} 
                          />
                        ) : (
                          <ReactMarkdown>{part.text}</ReactMarkdown>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Thinking Indicator (Dark) */}
          {(status === 'submitted' || (status === 'streaming' && messages[messages.length - 1]?.role !== 'assistant')) && (
            <div className="flex gap-4 justify-start animate-in fade-in duration-300">
              <div className="hidden sm:flex h-8 w-8 rounded-full bg-slate-900 border border-slate-800 shadow-sm items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-blue-500" />
              </div>
              <div className="bg-slate-900 border border-slate-800 shadow-sm rounded-2xl rounded-tl-sm px-5 py-3 text-sm text-slate-400 flex items-center gap-2">
                <span className="flex gap-1">
                  <span className="h-1.5 w-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="h-1.5 w-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="h-1.5 w-1.5 bg-slate-500 rounded-full animate-bounce"></span>
                </span>
                <span className="text-xs font-medium opacity-80">Analyzing...</span>
              </div>
            </div>
          )}
          
          <div ref={scrollRef} className="h-px w-full" />
        </div>
      </div>

      {/* --- INPUT AREA (Dark Glass) --- */}
      <div className="p-4 bg-slate-950/80 backdrop-blur-lg border-t border-slate-800 sticky bottom-0 z-20">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto relative flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            // Dark Input Styling
            className="flex-1 min-h-[48px] rounded-full border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500 px-5 shadow-sm focus-visible:ring-blue-500 focus-visible:border-blue-500"
            disabled={status !== 'ready' && status !== 'error'}
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={status !== 'ready' && status !== 'error'}
            className={`
               h-12 w-12 rounded-full shadow-md transition-all duration-200
               ${input.trim() ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}
            `}
          >
            <Send className="h-5 w-5 ml-0.5" />
          </Button>
        </form>
      </div>
    </div>
  );
}