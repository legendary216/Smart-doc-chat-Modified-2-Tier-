"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FileUploader } from "@/components/chat/file-uploader";
import { Loader2, Menu } from "lucide-react"; 
import { Button } from "@/components/ui/button"; 
import { useSidebar } from "@/components/app-shell";

export default function Home() {
  const { session } = useAuthStore();
  const router = useRouter();
  const { toggle } = useSidebar();

  useEffect(() => {
    if (session === null) {
      router.replace("/login"); 
    }
  }, [session, router]);

  if (session === undefined) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-500px h-500px bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500/50" />
          <p className="text-slate-500 text-xs font-medium tracking-widest uppercase">Initializing</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="relative flex h-screen w-full flex-col items-center justify-center bg-slate-950 overflow-hidden selection:bg-blue-500/30">
      
      {/* Refined Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-800px h-800px bg-blue-600/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Floating Sidebar Toggle */}
      <div className="absolute top-6 left-6 z-20">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggle} 
          className="text-slate-500 hover:text-white hover:bg-white/5 backdrop-blur-sm transition-all"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Minimalist Centered Content */}
      <div className="relative z-10 w-full max-w-xl px-6">
        <div className="group relative">
          {/* Glass Container */}
          <div className="bg-slate-900/20 backdrop-blur-2xl border border-white/0.05 rounded-[40px] p-4 shadow-2xl transition-all duration-500 hover:border-white/10">
            <div className="bg-slate-950/40 rounded-[32px] p-1 border border-white/0.03">
              <FileUploader />
            </div>
          </div>

          {/* Unobtrusive Trust Caption */}
          <div className="mt-6 text-center">
            <span className="text-[9px] uppercase tracking-[0.3em] font-medium text-slate-600 opacity-50 hover:opacity-100 transition-opacity cursor-default">
              Encrypted & Private
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}