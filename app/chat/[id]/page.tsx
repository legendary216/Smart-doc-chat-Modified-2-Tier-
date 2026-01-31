"use client";

import { useChat } from '@ai-sdk/react';
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Send, Bot, Menu, ArrowLeft } from "lucide-react";
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
  
  // 1. Manual Input State (Required by SDK v5+)
  const [input, setInput] = useState("");
  const [typingSpeed, setTypingSpeed] = useState(30); // 30ms default delay
  const [showSettings, setShowSettings] = useState(false);
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

  // 3. Fetch History from DB
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

  // 4. Initialize Hook
  // FIX: We removed 'api' (it defaults to /api/chat)
  // FIX: We removed 'initialMessages' (we hydrate manually below)
  const { messages, sendMessage, status, setMessages } = useChat();
useEffect(() => {
    if (status === 'streaming') {
      setHasStreamed(true);
    }
  }, [status]);
  // 5. Hydrate History (DB String -> SDK Parts)
  // This bypasses the 'initialMessages' type error safely
  useEffect(() => {
    if (dbMessages.length > 0 && messages.length === 0) {
      setMessages(
        dbMessages.map((m) => ({
          id: m.id,
          role: m.role,
          parts: [{ type: 'text', text: m.content }], 
        })) as any
      );
    }
  }, [dbMessages, setMessages]); 

  // 6. Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // 7. Submit Handler
  const handleSend = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const currentInput = input;
    setInput(""); // Clear UI immediately

    // FIX: Send Message with chatId in BODY
    // This fixes the 'body does not exist' error on useChat
    await sendMessage(
      { text: currentInput },
      { body: { chatId } } 
    );
  };

  return (
    <>
      <header className="h-16 border-b bg-white flex items-center justify-between px-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={toggle}>
            <Menu className="h-4 w-4" />
          </Button>
          <h1 className="font-semibold text-slate-800 flex items-center gap-2">
            <span className="md:hidden">
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </span>
            {title}
          </h1>
        </div>
        {/* Settings button removed */}
      </header>

      <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
        <div className="max-w-3xl mx-auto space-y-6 pb-4">
          
          {/* History Loading State */}
          {isHistoryLoading && messages.length === 0 && (
             <div className="space-y-4 mt-4 text-center text-slate-400">Loading history...</div>
          )}

          {/* Messages Loop */}
          {messages.map((m, index) => {
             const isLastMessage = index === messages.length - 1;
             const isAssistant = m.role === 'assistant';
             
             // Check if this specific message has finished typing visually
             const hasFinishedTyping = finishedTypingIds.has(m.id);

             // Use Typewriter if it's the Assistant, it's the last message, AND it hasn't finished typing yet
           const useTypewriter = isAssistant && isLastMessage && !hasFinishedTyping && hasStreamed;

             return (
              <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <Bot className="h-5 w-5 text-blue-600" />
                  </div>
                )}
                
                <div className={`max-w-[80%] rounded-2xl p-4 text-sm ${
                  m.role === "user" ? "bg-blue-600 text-white" : "bg-white border shadow-sm text-slate-800"
                }`}>
                  {m.parts.map((part, partIndex) => {
                    if (part.type !== 'text') return null;
                    
                    if (m.role === "user") {
                      return <span key={partIndex}>{part.text}</span>;
                    }

                    return (
                      <div key={partIndex} className="prose prose-sm max-w-none text-slate-800 prose-p:leading-relaxed">
                       {useTypewriter ? (
                          <Typewriter 
                            content={part.text} 
                            speed={HARDCODED_SPEED} // <--- Pass the constant here
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

          {/* Thinking State */}
         {(status === 'submitted' || (status === 'streaming' && messages[messages.length - 1]?.role !== 'assistant')) && (
            <div className="flex gap-3 justify-start">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <Bot className="h-5 w-5 text-blue-600" />
              </div>
              <div className="bg-white border shadow-sm rounded-2xl p-4 text-sm text-slate-500 italic">
                <span className="animate-pulse">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </div>

      <div className="p-4 bg-white border-t">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1"
            disabled={status !== 'ready' && status !== 'error'} // Allow retry on error
          />
          <Button type="submit" disabled={status !== 'ready' && status !== 'error'}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </>
  );
}