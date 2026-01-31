"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Send,
  ArrowLeft,
  MoreVertical,
  Paperclip,
  Bot,
  User,
  Menu,
  PanelLeftOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import { searchContext, generateAnswer } from "@/app/actions";
//import { ChatSidebar } from '@/components/chat/chat-sidebar'
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSidebar } from "@/components/app-shell";
import ReactMarkdown from "react-markdown";
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const params = useParams();
  const chatId = params.id as string;
  const { toggle, isOpen } = useSidebar();
  // --- CHANGED: Added QueryClient to manipulate cache ---
  const queryClient = useQueryClient();

  // --- CHANGED: "messages" is now fetched via React Query, not local state ---
  // const [messages, setMessages] = useState<Message[]>([])
  // const [isHistoryLoading, setIsHistoryLoading] = useState(true)

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false); // This is for AI "Thinking...", not history loading
  const [title, setTitle] = useState("Chat");

  const scrollRef = useRef<HTMLDivElement>(null);

  // NOTE: unused state in your snippet, but I kept it as requested to change nothing else
  const [isGenerating, setIsGenerating] = useState(false);

  // 1. Fetch Chat Details (Title) - Kept simple in useEffect
  useEffect(() => {
    const fetchTitle = async () => {
      const { data } = await supabase
        .from("chats")
        .select("file_name")
        .eq("id", chatId)
        .single();
      if (data) setTitle(data.file_name);
    };
    fetchTitle();
  }, [chatId]);

  // --- CHANGED: Replaced the Message Fetching useEffect with useQuery ---
  /* useEffect(() => {
    const fetchChatData = async () => {
        setIsHistoryLoading(true) 
        setMessages([]) 

      try {
        // ... old fetch logic ...
        const { data: msgData, error: msgError } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', chatId)
          .order('created_at', { ascending: true })

        if (msgError) throw msgError
        if (msgData) setMessages(msgData)

      } catch (error) {
        console.error("Error loading chat history:", error)
      } finally {
        setIsHistoryLoading(false) 
      }
    }
    fetchChatData()
  }, [chatId]) 
  */

  // --- NEW: React Query for Messages (Handles Caching & Loading) ---
  const {
    data: messages = [],
    isLoading: isHistoryLoading,
    isError,
  } = useQuery({
    queryKey: ["messages", chatId], // Unique key for this specific chat
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Message[];
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // 2. Handle Submission
  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userQuestion = input;
    setInput("");
    setIsLoading(true);

    // A. Optimistic UI update
    const userMsgOptimistic: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userQuestion,
    };

    // --- CHANGED: Update Cache instead of State ---
    // setMessages(prev => [...prev, userMsgOptimistic])
    queryClient.setQueryData(["messages", chatId], (old: Message[] = []) => {
      return [...old, userMsgOptimistic];
    });

    try {
      // B. Save User Message to DB
      const { error: userMsgError } = await supabase
        .from("messages")
        .insert({ chat_id: chatId, role: "user", content: userQuestion });

      if (userMsgError)
        throw new Error("Failed to save user message: " + userMsgError.message);

      // C. RAG Pipeline
      console.log("Searching...");
     
      const contextResults = await searchContext(userQuestion, chatId);

      const contextText = contextResults
        .map(
          (c: any) => `
  START PAGE ${c.page} BLOCK:
  ${c.content}
  END PAGE ${c.page} BLOCK
`,
        )
        .join("\n\n");
        console.log("context : ",contextResults);
        
      console.log("Generating answer...");
      const answer = await generateAnswer(contextText, userQuestion);

      // D. Update UI with AI Answer
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: answer,
      };

      // --- CHANGED: Update Cache instead of State ---
      // setMessages(prev => [...prev, aiMsg])
      queryClient.setQueryData(["messages", chatId], (old: Message[] = []) => {
        return [...old, aiMsg];
      });

      // E. Save AI Message to DB
      const { error: aiMsgError } = await supabase
        .from("messages")
        .insert({ chat_id: chatId, role: "assistant", content: answer });

      if (aiMsgError)
        throw new Error("Failed to save AI message: " + aiMsgError.message);
    } catch (err) {
      console.error("Chat Error:", err);

      const errorMsg: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      };

      // --- CHANGED: Update Cache for Error Message ---
      // setMessages(prev => [...prev, errorMsg])
      queryClient.setQueryData(["messages", chatId], (old: Message[] = []) => {
        return [...old, errorMsg];
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <header className="h-16 border-b bg-white flex items-center justify-between px-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={toggle}>
            <Menu className="h-4 w-4" />{" "}
            {/* Use Menu icon instead of MoreVertical if you prefer */}
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
      </header>

     <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
        <div className="max-w-3xl mx-auto space-y-6 pb-4">
          {/* --- NEW LOADING SKELETON (Controlled by React Query now) --- */}
          {isHistoryLoading ? (
            <div className="space-y-4 mt-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="flex gap-3 justify-start animate-pulse">
                  <div className="h-8 w-8 rounded-full bg-slate-200" />
                  <div className="h-16 w-[60%] rounded-2xl bg-slate-200" />
                </div>
              ))}
            </div>
          ) : isError ? (
            /* 2. ADD THIS NEW ERROR CHECK HERE */
            <div className="p-10 text-center text-red-500">
              Failed to load chat history.
            </div>
          ) : (
            <>
              {/* --- YOUR EXISTING MESSAGES MAPPING --- */}
              {messages.length === 0 && (
                <div className="text-center text-slate-400 mt-20">
                  <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium text-slate-600">
                    Ask me anything about this document!
                  </h3>
                </div>
              )}

              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.role === "assistant" && (
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <Bot className="h-5 w-5 text-blue-600" />
                    </div>
                  )}
                  <div
                    className={`
                                max-w-[80%] rounded-2xl p-4 text-sm 
                                ${m.role === "user" ? "bg-blue-600 text-white" : "bg-white border shadow-sm text-slate-800"}
                                overflow-hidden
                                `}
                  >
                    {m.role === "user" ? (
                      m.content
                    ) : (
                      <div className="prose prose-sm max-w-none text-slate-800 prose-p:leading-relaxed prose-pre:bg-slate-100 prose-pre:text-slate-900">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* --- EXISTING "Thinking..." LOADER --- */}
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
            </>
          )}

          <div ref={scrollRef} />
        </div>
      </div>

      <div className="p-4 bg-white border-t">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </>
  );
}
